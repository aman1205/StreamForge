import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { TopicsService } from '../topics/topics.service';
import { SendToDlqDto } from './dto/send-to-dlq.dto';
import { RetryDlqMessageDto } from './dto/retry-dlq-message.dto';
import { DlqStatus, FailureReason } from '@prisma/client';

@Injectable()
export class DlqService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private topicsService: TopicsService,
  ) {}

  async sendToDlq(dto: SendToDlqDto) {
    // Verify topic exists
    await this.topicsService.findOne(dto.topicId);

    // Create DLQ entry
    const dlqMessage = await this.prisma.deadLetterQueue.create({
      data: {
        topicId: dto.topicId,
        consumerGroupId: dto.consumerGroupId,
        partition: dto.partition,
        originalOffset: dto.originalOffset,
        payload: dto.payload,
        metadata: dto.metadata || null,
        errorMessage: dto.errorMessage,
        errorStack: dto.errorStack || null,
        failureReason: dto.failureReason || FailureReason.UNKNOWN,
        maxRetries: dto.maxRetries || 3,
        nextRetryAt: this.calculateNextRetry(0),
      },
    });

    return dlqMessage;
  }

  async findByTopic(topicId: string, status?: DlqStatus) {
    const where: any = { topicId };
    if (status) {
      where.status = status;
    }

    return this.prisma.deadLetterQueue.findMany({
      where,
      include: {
        retryHistory: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByConsumerGroup(consumerGroupId: string, status?: DlqStatus) {
    const where: any = { consumerGroupId };
    if (status) {
      where.status = status;
    }

    return this.prisma.deadLetterQueue.findMany({
      where,
      include: {
        retryHistory: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(dlqId: string) {
    const dlqMessage = await this.prisma.deadLetterQueue.findUnique({
      where: { id: dlqId },
      include: {
        retryHistory: {
          orderBy: { retriedAt: 'desc' },
        },
      },
    });

    if (!dlqMessage) {
      throw new NotFoundException('DLQ message not found');
    }

    return dlqMessage;
  }

  async retry(dlqId: string, dto: RetryDlqMessageDto) {
    const dlqMessage = await this.findOne(dlqId);

    // Check if can retry
    if (dlqMessage.retryCount >= dlqMessage.maxRetries) {
      throw new BadRequestException('Maximum retry attempts exceeded');
    }

    if (dlqMessage.status === DlqStatus.RESOLVED) {
      throw new BadRequestException('Message already resolved');
    }

    // Update status to retrying
    await this.prisma.deadLetterQueue.update({
      where: { id: dlqId },
      data: {
        status: DlqStatus.RETRYING,
        updatedAt: new Date(),
      },
    });

    try {
      // Determine target topic
      const targetTopicId = dto.destinationTopic
        ? (await this.topicsService.findOne(dto.destinationTopic)).id
        : dlqMessage.topicId;

      const topic = await this.topicsService.findOne(targetTopicId);

      // Republish to target topic
      const streamKey = this.topicsService.getStreamKey(
        targetTopicId,
        dlqMessage.partition,
      );

      const eventId = await this.redis.xadd(streamKey, {
        payload: JSON.stringify(dlqMessage.payload),
        timestamp: Date.now().toString(),
        topic: topic.name,
        partition: dlqMessage.partition.toString(),
        dlq_retry: 'true',
        original_offset: dlqMessage.originalOffset,
      });

      // Record successful retry
      await this.prisma.retryHistory.create({
        data: {
          dlqId,
          attemptNumber: dlqMessage.retryCount + 1,
          success: true,
        },
      });

      // Update DLQ message
      await this.prisma.deadLetterQueue.update({
        where: { id: dlqId },
        data: {
          status: DlqStatus.RESOLVED,
          retryCount: dlqMessage.retryCount + 1,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        newOffset: eventId,
        status: DlqStatus.RESOLVED,
      };
    } catch (error) {
      // Record failed retry
      await this.prisma.retryHistory.create({
        data: {
          dlqId,
          attemptNumber: dlqMessage.retryCount + 1,
          errorMessage: error.message,
          success: false,
        },
      });

      // Update DLQ message
      const newRetryCount = dlqMessage.retryCount + 1;
      const status =
        newRetryCount >= dlqMessage.maxRetries ? DlqStatus.FAILED : DlqStatus.PENDING;

      await this.prisma.deadLetterQueue.update({
        where: { id: dlqId },
        data: {
          status,
          retryCount: newRetryCount,
          nextRetryAt: this.calculateNextRetry(newRetryCount),
          updatedAt: new Date(),
        },
      });

      throw error;
    }
  }

  async retryAll(topicId: string) {
    const pendingMessages = await this.prisma.deadLetterQueue.findMany({
      where: {
        topicId,
        status: DlqStatus.PENDING,
      },
    });

    const results = [];

    for (const msg of pendingMessages) {
      try {
        const result = await this.retry(msg.id, {});
        results.push({ id: msg.id, success: true, ...result });
      } catch (error) {
        results.push({
          id: msg.id,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      total: pendingMessages.length,
      results,
    };
  }

  async resolve(dlqId: string) {
    const dlqMessage = await this.findOne(dlqId);

    if (dlqMessage.status === DlqStatus.RESOLVED) {
      throw new BadRequestException('Message already resolved');
    }

    await this.prisma.deadLetterQueue.update({
      where: { id: dlqId },
      data: {
        status: DlqStatus.RESOLVED,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { success: true };
  }

  async delete(dlqId: string) {
    await this.findOne(dlqId); // Verify exists

    await this.prisma.deadLetterQueue.delete({
      where: { id: dlqId },
    });

    return { success: true };
  }

  async purge(topicId: string, olderThanDays?: number) {
    const where: any = {
      topicId,
      status: DlqStatus.RESOLVED,
    };

    if (olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      where.resolvedAt = {
        lt: cutoffDate,
      };
    }

    const result = await this.prisma.deadLetterQueue.deleteMany({
      where,
    });

    return {
      success: true,
      deleted: result.count,
    };
  }

  async getStats(topicId: string) {
    const [pending, retrying, failed, resolved, total] = await Promise.all([
      this.prisma.deadLetterQueue.count({
        where: { topicId, status: DlqStatus.PENDING },
      }),
      this.prisma.deadLetterQueue.count({
        where: { topicId, status: DlqStatus.RETRYING },
      }),
      this.prisma.deadLetterQueue.count({
        where: { topicId, status: DlqStatus.FAILED },
      }),
      this.prisma.deadLetterQueue.count({
        where: { topicId, status: DlqStatus.RESOLVED },
      }),
      this.prisma.deadLetterQueue.count({
        where: { topicId },
      }),
    ]);

    // Get failure reasons breakdown
    const failureReasons = await this.prisma.deadLetterQueue.groupBy({
      by: ['failureReason'],
      where: { topicId },
      _count: true,
    });

    return {
      total,
      pending,
      retrying,
      failed,
      resolved,
      byFailureReason: failureReasons.map((fr) => ({
        reason: fr.failureReason,
        count: fr._count,
      })),
    };
  }

  // Private helper methods

  private calculateNextRetry(retryCount: number): Date {
    // Exponential backoff: 2^retryCount minutes
    const delayMinutes = Math.pow(2, retryCount);
    const nextRetry = new Date();
    nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);
    return nextRetry;
  }
}
