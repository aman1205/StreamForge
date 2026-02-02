import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { CreateTopicDto } from './dto/create-topic.dto';

@Injectable()
export class TopicsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(workspaceId: string, dto: CreateTopicDto) {
    // Check if topic name already exists in workspace
    const existing = await this.prisma.topic.findUnique({
      where: {
        workspaceId_name: {
          workspaceId,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Topic name already exists in this workspace');
    }

    // Create topic in database
    const topic = await this.prisma.topic.create({
      data: {
        workspaceId,
        name: dto.name,
        partitions: dto.partitions || 1,
        retentionMs: dto.retentionMs || 604800000, // 7 days default
        schema: dto.schema || null,
      },
    });

    // Create Redis Streams for each partition
    for (let i = 0; i < topic.partitions; i++) {
      const streamKey = this.getStreamKey(topic.id, i);
      // Create a consumer group for the topic (foundation for consumer groups later)
      await this.redis.xgroupCreate(streamKey, 'default-group', '0');
    }

    return topic;
  }

  async findByWorkspace(workspaceId: string) {
    return this.prisma.topic.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        workspace: true,
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return topic;
  }

  async delete(topicId: string) {
    const topic = await this.findOne(topicId);

    // Delete from database
    await this.prisma.topic.delete({
      where: { id: topicId },
    });

    // Note: Redis Streams will remain but can be cleaned up with a background job
    // For now, we'll leave them (they'll expire based on retention policy)

    return { success: true };
  }

  getStreamKey(topicId: string, partition: number): string {
    return `topic:${topicId}:partition:${partition}`;
  }
}
