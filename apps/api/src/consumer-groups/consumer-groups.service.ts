import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { TopicsService } from '../topics/topics.service';
import { CreateConsumerGroupDto } from './dto/create-consumer-group.dto';
import { RegisterConsumerDto } from './dto/register-consumer.dto';
import { CommitOffsetDto } from './dto/commit-offset.dto';
import { ConsumerStatus } from '@prisma/client';

@Injectable()
export class ConsumerGroupsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private topicsService: TopicsService,
  ) {}

  async create(topicId: string, dto: CreateConsumerGroupDto) {
    // Verify topic exists
    const topic = await this.topicsService.findOne(topicId);

    // Check if consumer group already exists
    const existing = await this.prisma.consumerGroup.findUnique({
      where: {
        topicId_name: {
          topicId,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Consumer group already exists for this topic');
    }

    // Create consumer group
    const consumerGroup = await this.prisma.consumerGroup.create({
      data: {
        topicId,
        name: dto.name,
      },
      include: {
        topic: true,
      },
    });

    // Create Redis consumer group for each partition
    for (let i = 0; i < topic.partitions; i++) {
      const streamKey = this.topicsService.getStreamKey(topicId, i);
      await this.redis.xgroupCreate(streamKey, dto.name, '0');
    }

    return consumerGroup;
  }

  async findByTopic(topicId: string) {
    const consumerGroups = await this.prisma.consumerGroup.findMany({
      where: { topicId },
      include: {
        consumers: true,
        offsets: true,
        topic: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats for each consumer group
    return Promise.all(
      consumerGroups.map(async (cg) => {
        const activeConsumers = cg.consumers.filter(
          (c) => c.status === ConsumerStatus.ACTIVE,
        ).length;

        const partitionsAssigned = cg.consumers.reduce((acc, consumer) => {
          return acc + (consumer.assignedPartitions as any[]).length;
        }, 0);

        return {
          ...cg,
          activeConsumers,
          totalConsumers: cg.consumers.length,
          partitionsAssigned,
        };
      }),
    );
  }

  async findOne(consumerGroupId: string) {
    const consumerGroup = await this.prisma.consumerGroup.findUnique({
      where: { id: consumerGroupId },
      include: {
        topic: true,
        consumers: true,
        offsets: true,
      },
    });

    if (!consumerGroup) {
      throw new NotFoundException('Consumer group not found');
    }

    return consumerGroup;
  }

  async registerConsumer(consumerGroupId: string, dto: RegisterConsumerDto) {
    const consumerGroup = await this.findOne(consumerGroupId);

    // Check if consumer already exists
    const existing = await this.prisma.consumer.findUnique({
      where: {
        consumerGroupId_consumerId: {
          consumerGroupId,
          consumerId: dto.consumerId,
        },
      },
    });

    if (existing) {
      // Update heartbeat
      return this.prisma.consumer.update({
        where: { id: existing.id },
        data: {
          lastHeartbeat: new Date(),
          status: ConsumerStatus.ACTIVE,
        },
      });
    }

    // Create new consumer
    const consumer = await this.prisma.consumer.create({
      data: {
        consumerGroupId,
        consumerId: dto.consumerId,
        status: ConsumerStatus.ACTIVE,
      },
    });

    // Trigger rebalancing
    await this.rebalancePartitions(consumerGroupId);

    return consumer;
  }

  async heartbeat(consumerGroupId: string, consumerId: string) {
    const consumer = await this.prisma.consumer.findUnique({
      where: {
        consumerGroupId_consumerId: {
          consumerGroupId,
          consumerId,
        },
      },
    });

    if (!consumer) {
      throw new NotFoundException('Consumer not found');
    }

    return this.prisma.consumer.update({
      where: { id: consumer.id },
      data: {
        lastHeartbeat: new Date(),
        status: ConsumerStatus.ACTIVE,
      },
    });
  }

  async unregisterConsumer(consumerGroupId: string, consumerId: string) {
    const consumer = await this.prisma.consumer.findUnique({
      where: {
        consumerGroupId_consumerId: {
          consumerGroupId,
          consumerId,
        },
      },
    });

    if (!consumer) {
      throw new NotFoundException('Consumer not found');
    }

    await this.prisma.consumer.delete({
      where: { id: consumer.id },
    });

    // Trigger rebalancing
    await this.rebalancePartitions(consumerGroupId);

    return { success: true };
  }

  async commitOffset(consumerGroupId: string, dto: CommitOffsetDto) {
    const consumerGroup = await this.findOne(consumerGroupId);

    // Validate partition exists
    if (dto.partition >= consumerGroup.topic.partitions) {
      throw new BadRequestException('Invalid partition number');
    }

    // Upsert offset
    await this.prisma.consumerOffset.upsert({
      where: {
        consumerGroupId_partition: {
          consumerGroupId,
          partition: dto.partition,
        },
      },
      update: {
        offset: dto.offset,
        committedAt: new Date(),
      },
      create: {
        consumerGroupId,
        partition: dto.partition,
        offset: dto.offset,
      },
    });

    return { success: true };
  }

  async getOffsets(consumerGroupId: string) {
    return this.prisma.consumerOffset.findMany({
      where: { consumerGroupId },
      orderBy: { partition: 'asc' },
    });
  }

  async resetOffset(consumerGroupId: string, partition: number, offset: string) {
    const consumerGroup = await this.findOne(consumerGroupId);

    if (partition >= consumerGroup.topic.partitions) {
      throw new BadRequestException('Invalid partition number');
    }

    await this.prisma.consumerOffset.upsert({
      where: {
        consumerGroupId_partition: {
          consumerGroupId,
          partition,
        },
      },
      update: {
        offset,
        committedAt: new Date(),
      },
      create: {
        consumerGroupId,
        partition,
        offset,
      },
    });

    return { success: true };
  }

  async getLag(consumerGroupId: string) {
    const consumerGroup = await this.findOne(consumerGroupId);
    const offsets = await this.getOffsets(consumerGroupId);

    const lag = [];

    for (let partition = 0; partition < consumerGroup.topic.partitions; partition++) {
      const streamKey = this.topicsService.getStreamKey(
        consumerGroup.topicId,
        partition,
      );

      // Get latest offset from Redis Stream
      const info = await this.redis.getClient().xinfo('STREAM', streamKey) as any[];
      const lastGeneratedId = info[info.indexOf('last-generated-id') + 1] as string;

      // Get committed offset
      const committedOffset = offsets.find((o) => o.partition === partition);

      // Calculate lag (simplified - in production, parse Redis IDs properly)
      const lagCount = committedOffset
        ? await this.calculateMessagesBetween(
            streamKey,
            committedOffset.offset,
            lastGeneratedId,
          )
        : await this.countAllMessages(streamKey);

      lag.push({
        partition,
        committedOffset: committedOffset?.offset || null,
        latestOffset: lastGeneratedId,
        lag: lagCount,
      });
    }

    return lag;
  }

  async delete(consumerGroupId: string) {
    const consumerGroup = await this.findOne(consumerGroupId);

    // Delete from database (cascades to consumers and offsets)
    await this.prisma.consumerGroup.delete({
      where: { id: consumerGroupId },
    });

    // Note: Redis consumer groups remain but can be cleaned up separately

    return { success: true };
  }

  // Private helper methods

  private async rebalancePartitions(consumerGroupId: string) {
    const consumerGroup = await this.findOne(consumerGroupId);
    const activeConsumers = consumerGroup.consumers.filter(
      (c) => c.status === ConsumerStatus.ACTIVE,
    );

    if (activeConsumers.length === 0) {
      return;
    }

    const totalPartitions = consumerGroup.topic.partitions;
    const partitionsPerConsumer = Math.floor(totalPartitions / activeConsumers.length);
    const remainingPartitions = totalPartitions % activeConsumers.length;

    let partitionIndex = 0;

    // Assign partitions round-robin
    for (let i = 0; i < activeConsumers.length; i++) {
      const consumer = activeConsumers[i];
      const partitionsToAssign =
        partitionsPerConsumer + (i < remainingPartitions ? 1 : 0);

      const assignedPartitions = [];
      for (let j = 0; j < partitionsToAssign; j++) {
        assignedPartitions.push(partitionIndex++);
      }

      await this.prisma.consumer.update({
        where: { id: consumer.id },
        data: {
          assignedPartitions: assignedPartitions as any,
          status: ConsumerStatus.ACTIVE,
        },
      });
    }
  }

  private async calculateMessagesBetween(
    streamKey: string,
    fromOffset: string,
    toOffset: string,
  ): Promise<number> {
    try {
      const messages = await this.redis.getClient().xrange(streamKey, fromOffset, toOffset);
      return Math.max(0, messages.length - 1); // Exclude the fromOffset message
    } catch {
      return 0;
    }
  }

  private async countAllMessages(streamKey: string): Promise<number> {
    try {
      const info = await this.redis.getClient().xinfo('STREAM', streamKey) as any[];
      return info[info.indexOf('length') + 1] as number;
    } catch {
      return 0;
    }
  }
}
