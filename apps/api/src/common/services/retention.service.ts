import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import { TopicsService } from '../../topics/topics.service';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private topicsService: TopicsService,
  ) {}

  /**
   * Run retention enforcement every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async enforceRetention() {
    this.logger.log('Starting retention policy enforcement...');

    try {
      const topics = await this.prisma.topic.findMany({
        select: {
          id: true,
          name: true,
          partitions: true,
          retentionMs: true,
        },
      });

      let totalTrimmed = 0;

      for (const topic of topics) {
        const trimmed = await this.trimTopic(
          topic.id,
          topic.partitions,
          Number(topic.retentionMs),
        );
        totalTrimmed += trimmed;
      }

      this.logger.log(
        `Retention enforcement complete. Trimmed ${totalTrimmed} messages across ${topics.length} topics`,
      );
    } catch (error) {
      this.logger.error('Error during retention enforcement:', error);
    }
  }

  /**
   * Trim messages older than retention period for a specific topic
   */
  async trimTopic(
    topicId: string,
    partitions: number,
    retentionMs: number,
  ): Promise<number> {
    let totalTrimmed = 0;

    // Calculate cutoff timestamp
    const cutoffTime = Date.now() - retentionMs;
    const cutoffId = `${cutoffTime}-0`;

    for (let partition = 0; partition < partitions; partition++) {
      const streamKey = this.topicsService.getStreamKey(topicId, partition);

      try {
        // Use XTRIM with MINID to remove messages older than cutoff
        const trimmed = await this.redis
          .getClient()
          .xtrim(streamKey, 'MINID', cutoffId);

        if (trimmed > 0) {
          this.logger.debug(
            `Trimmed ${trimmed} messages from ${streamKey} (older than ${new Date(cutoffTime).toISOString()})`,
          );
          totalTrimmed += trimmed;
        }
      } catch (error) {
        this.logger.error(`Error trimming ${streamKey}:`, error.message);
      }
    }

    return totalTrimmed;
  }

  /**
   * Manually enforce retention for a specific topic
   */
  async enforceForTopic(topicId: string): Promise<number> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        partitions: true,
        retentionMs: true,
      },
    });

    if (!topic) {
      throw new Error('Topic not found');
    }

    return this.trimTopic(topicId, topic.partitions, Number(topic.retentionMs));
  }

  /**
   * Get stream size for a topic
   */
  async getTopicSize(topicId: string, partitions: number): Promise<number> {
    let totalSize = 0;

    for (let partition = 0; partition < partitions; partition++) {
      const streamKey = this.topicsService.getStreamKey(topicId, partition);

      try {
        const info = await this.redis.getClient().xinfo('STREAM', streamKey) as any[];
        const length = info[info.indexOf('length') + 1] as number;
        totalSize += length;
      } catch (error) {
        // Stream might not exist yet
        continue;
      }
    }

    return totalSize;
  }

  /**
   * Get oldest message timestamp for a topic
   */
  async getOldestMessage(
    topicId: string,
    partitions: number,
  ): Promise<Date | null> {
    let oldestTimestamp: number | null = null;

    for (let partition = 0; partition < partitions; partition++) {
      const streamKey = this.topicsService.getStreamKey(topicId, partition);

      try {
        // Read the first message from the stream
        const result = await this.redis.getClient().xrange(streamKey, '-', '+', 'COUNT', 1);

        if (result && result.length > 0) {
          const [id] = result[0];
          // Redis Stream ID format: timestamp-sequence
          const timestamp = parseInt(id.split('-')[0]);

          if (!oldestTimestamp || timestamp < oldestTimestamp) {
            oldestTimestamp = timestamp;
          }
        }
      } catch (error) {
        continue;
      }
    }

    return oldestTimestamp ? new Date(oldestTimestamp) : null;
  }

  /**
   * Clean up empty streams (optional maintenance)
   */
  async cleanupEmptyStreams() {
    this.logger.log('Cleaning up empty streams...');

    const topics = await this.prisma.topic.findMany({
      select: {
        id: true,
        partitions: true,
      },
    });

    let cleaned = 0;

    for (const topic of topics) {
      for (let partition = 0; partition < topic.partitions; partition++) {
        const streamKey = this.topicsService.getStreamKey(topic.id, partition);

        try {
          const info = await this.redis.getClient().xinfo('STREAM', streamKey) as any[];
          const length = info[info.indexOf('length') + 1] as number;

          // If stream is empty and has no consumer groups, we could delete it
          // But for now, we'll just log it
          if (length === 0) {
            this.logger.debug(`Empty stream found: ${streamKey}`);
            cleaned++;
          }
        } catch (error) {
          // Stream doesn't exist - that's fine
          continue;
        }
      }
    }

    this.logger.log(`Found ${cleaned} empty streams`);
    return cleaned;
  }
}
