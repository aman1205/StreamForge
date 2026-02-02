import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { RedisService } from '../common/redis.service';
import { TopicsService } from '../topics/topics.service';
import { PrismaService } from '../common/prisma.service';
import { PublishEventDto } from './dto/publish-event.dto';
import { ConsumeEventsDto } from './dto/consume-events.dto';
import { ConsumeFromGroupDto } from './dto/consume-from-group.dto';
import { AcknowledgeMessageDto } from './dto/acknowledge-message.dto';
import { NackMessageDto } from './dto/nack-message.dto';

@Injectable()
export class EventsService {
  constructor(
    private redis: RedisService,
    private topicsService: TopicsService,
    private prisma: PrismaService,
  ) {}

  async publish(topicId: string, dto: PublishEventDto) {
    // Get topic to validate and get partition count
    const topic = await this.topicsService.findOne(topicId);

    // Determine partition (default to 0 for foundation phase)
    const partition = dto.partition || 0;

    if (partition >= topic.partitions) {
      throw new BadRequestException(
        `Partition ${partition} does not exist. Topic has ${topic.partitions} partition(s)`,
      );
    }

    // Get stream key
    const streamKey = this.topicsService.getStreamKey(topicId, partition);

    // Publish event to Redis Stream
    const now = Date.now();
    const eventData: Record<string, string> = {
      payload: JSON.stringify(dto.payload),
      timestamp: now.toString(),
      topic: topic.name,
      partition: partition.toString(),
    };

    // Add TTL if specified
    if (dto.ttlMs) {
      const expiresAt = now + dto.ttlMs;
      eventData.expiresAt = expiresAt.toString();
      eventData.ttl = dto.ttlMs.toString();
    }

    const eventId = await this.redis.xadd(streamKey, eventData);

    // Publish to Redis pub/sub for real-time WebSocket broadcasting
    try {
      await this.redis.getClient().publish(
        'streamforge:events',
        JSON.stringify({
          topicId,
          event: {
            id: eventId,
            topic: topic.name,
            partition,
            offset: eventId,
            payload: dto.payload,
            timestamp: new Date(now).toISOString(),
            expiresAt: dto.ttlMs ? new Date(now + dto.ttlMs).toISOString() : null,
          },
        }),
      );
    } catch (error) {
      console.error('Failed to publish to Redis pub/sub:', error);
      // Don't fail the request if pub/sub fails
    }

    return {
      success: true,
      eventId,
      topic: topic.name,
      partition,
      offset: eventId,
      expiresAt: dto.ttlMs ? new Date(now + dto.ttlMs) : null,
    };
  }

  async consume(topicId: string, dto: ConsumeEventsDto) {
    // Get topic to validate
    const topic = await this.topicsService.findOne(topicId);

    // Determine partition (default to 0)
    const partition = dto.partition || 0;

    if (partition >= topic.partitions) {
      throw new BadRequestException(
        `Partition ${partition} does not exist. Topic has ${topic.partitions} partition(s)`,
      );
    }

    // Get stream key
    const streamKey = this.topicsService.getStreamKey(topicId, partition);

    // Determine starting offset
    const offset = dto.offset || '0'; // Start from beginning if no offset provided
    const limit = dto.limit || 100;

    // Read events from Redis Stream
    const result = await this.redis.xread([streamKey], [offset], limit);

    if (!result || result.length === 0) {
      return {
        events: [],
        nextOffset: null,
      };
    }

    // Parse events
    const [_stream, messages] = result[0];
    const events = messages.map(([id, fields]) => {
      const fieldMap = this.arrayToObject(fields);
      return {
        id,
        topic: topic.name,
        partition,
        offset: id,
        timestamp: parseInt(fieldMap.timestamp),
        payload: JSON.parse(fieldMap.payload),
      };
    });

    // Get next offset (last event ID)
    const nextOffset = events.length > 0 ? events[events.length - 1].offset : null;

    return {
      events,
      nextOffset,
    };
  }

  async consumeFromGroup(consumerGroupId: string, dto: ConsumeFromGroupDto) {
    // Get consumer group and verify consumer
    const consumerGroup = await this.prisma.consumerGroup.findUnique({
      where: { id: consumerGroupId },
      include: {
        topic: true,
        consumers: true,
      },
    });

    if (!consumerGroup) {
      throw new NotFoundException('Consumer group not found');
    }

    // Find the consumer
    const consumer = consumerGroup.consumers.find(
      (c) => c.consumerId === dto.consumerId,
    );

    if (!consumer) {
      throw new NotFoundException(
        'Consumer not registered in this consumer group',
      );
    }

    // Get assigned partitions
    const assignedPartitions = consumer.assignedPartitions as number[];

    if (assignedPartitions.length === 0) {
      return {
        events: [],
        partitions: [],
      };
    }

    // If specific partition requested, verify it's assigned
    if (dto.partition !== undefined) {
      if (!assignedPartitions.includes(dto.partition)) {
        throw new BadRequestException(
          'Partition not assigned to this consumer',
        );
      }
    }

    const limit = dto.limit || 100;
    const allEvents = [];

    // Consume from assigned partitions
    const partitionsToConsume = dto.partition !== undefined
      ? [dto.partition]
      : assignedPartitions;

    for (const partition of partitionsToConsume) {
      const streamKey = this.topicsService.getStreamKey(
        consumerGroup.topicId,
        partition,
      );

      // Get last committed offset for this partition
      const committedOffset = await this.prisma.consumerOffset.findUnique({
        where: {
          consumerGroupId_partition: {
            consumerGroupId,
            partition,
          },
        },
      });

      // Use XREADGROUP for consumer group semantics
      const startOffset = committedOffset?.offset || '0';

      try {
        const result = await this.redis.xreadgroup(
          consumerGroup.name,
          dto.consumerId,
          [streamKey],
          [startOffset === '0' ? '>' : startOffset],
          limit,
        );

        if (result && result.length > 0) {
          const [_stream, messages] = result[0];
          const events = messages.map(([id, fields]) => {
            const fieldMap = this.arrayToObject(fields);
            return {
              id,
              topic: consumerGroup.topic.name,
              partition,
              offset: id,
              timestamp: parseInt(fieldMap.timestamp),
              payload: JSON.parse(fieldMap.payload),
            };
          });

          allEvents.push(...events);

          // Auto-commit if enabled
          if (dto.autoCommit && events.length > 0) {
            const lastOffset = events[events.length - 1].offset;
            await this.prisma.consumerOffset.upsert({
              where: {
                consumerGroupId_partition: {
                  consumerGroupId,
                  partition,
                },
              },
              update: {
                offset: lastOffset,
                committedAt: new Date(),
              },
              create: {
                consumerGroupId,
                partition,
                offset: lastOffset,
              },
            });
          }
        }
      } catch (error) {
        // If consumer group doesn't exist in Redis, skip this partition
        console.error(`Error reading from partition ${partition}:`, error.message);
      }
    }

    return {
      events: allEvents,
      partitions: partitionsToConsume,
    };
  }

  async acknowledgeMessages(consumerGroupId: string, dto: AcknowledgeMessageDto) {
    // Verify consumer group exists
    const consumerGroup = await this.prisma.consumerGroup.findUnique({
      where: { id: consumerGroupId },
    });

    if (!consumerGroup) {
      throw new NotFoundException('Consumer group not found');
    }

    const acknowledged = [];

    for (const offset of dto.offsets) {
      try {
        // Find pending acknowledgment
        const ack = await this.prisma.messageAcknowledgment.findFirst({
          where: {
            consumerGroupId,
            consumerId: dto.consumerId,
            offset,
            acknowledged: false,
          },
        });

        if (ack) {
          // Mark as acknowledged
          await this.prisma.messageAcknowledgment.update({
            where: { id: ack.id },
            data: {
              acknowledged: true,
              ackAt: new Date(),
            },
          });

          // Commit offset
          await this.prisma.consumerOffset.upsert({
            where: {
              consumerGroupId_partition: {
                consumerGroupId,
                partition: ack.partition,
              },
            },
            update: {
              offset,
              committedAt: new Date(),
            },
            create: {
              consumerGroupId,
              partition: ack.partition,
              offset,
            },
          });

          acknowledged.push(offset);
        }
      } catch (error) {
        console.error(`Failed to acknowledge offset ${offset}:`, error.message);
      }
    }

    return {
      success: true,
      acknowledged: acknowledged.length,
      total: dto.offsets.length,
    };
  }

  async nackMessage(consumerGroupId: string, dto: NackMessageDto) {
    // Verify consumer group exists
    const consumerGroup = await this.prisma.consumerGroup.findUnique({
      where: { id: consumerGroupId },
      include: { topic: true },
    });

    if (!consumerGroup) {
      throw new NotFoundException('Consumer group not found');
    }

    // Find pending acknowledgment
    const ack = await this.prisma.messageAcknowledgment.findFirst({
      where: {
        consumerGroupId,
        consumerId: dto.consumerId,
        offset: dto.offset,
        acknowledged: false,
      },
    });

    if (!ack) {
      throw new NotFoundException('Acknowledgment not found or already processed');
    }

    // Mark as nacked
    await this.prisma.messageAcknowledgment.update({
      where: { id: ack.id },
      data: {
        acknowledged: false,
        nackAt: new Date(),
        nackReason: dto.reason || 'Message rejected',
      },
    });

    // If requeue is true, reset visibility timeout
    if (dto.requeue) {
      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + 30); // 30 second requeue delay

      await this.prisma.messageAcknowledgment.update({
        where: { id: ack.id },
        data: {
          expiresAt: newExpiresAt,
          nackAt: null,
        },
      });
    }

    return {
      success: true,
      requeued: dto.requeue || false,
    };
  }

  async cleanupExpiredAcknowledgments() {
    // Delete expired acknowledgments that were never acknowledged
    const result = await this.prisma.messageAcknowledgment.deleteMany({
      where: {
        acknowledged: false,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return {
      success: true,
      cleaned: result.count,
    };
  }

  private arrayToObject(arr: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    for (let i = 0; i < arr.length; i += 2) {
      obj[arr[i]] = arr[i + 1];
    }
    return obj;
  }
}
