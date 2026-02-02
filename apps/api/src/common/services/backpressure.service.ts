import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis.service';

interface ConsumerMetrics {
  consumerId: string;
  lastPollTime: number;
  messagesProcessed: number;
  processingRate: number; // messages per second
  lagScore: number; // 0-100, higher = more lag
}

@Injectable()
export class BackpressureService {
  private consumerMetrics: Map<string, ConsumerMetrics> = new Map();
  private readonly MAX_MESSAGES_PER_POLL = 1000;
  private readonly MIN_MESSAGES_PER_POLL = 10;
  private readonly POLL_INTERVAL_MS = 1000;

  constructor(private redis: RedisService) {}

  /**
   * Calculate optimal batch size based on consumer performance
   */
  calculateBatchSize(consumerId: string, requestedLimit: number): number {
    const metrics = this.consumerMetrics.get(consumerId);

    if (!metrics) {
      // First poll - use requested limit or default
      return Math.min(requestedLimit || 100, this.MAX_MESSAGES_PER_POLL);
    }

    // Calculate processing rate
    const timeSinceLastPoll = Date.now() - metrics.lastPollTime;
    const rate = metrics.messagesProcessed / (timeSinceLastPoll / 1000);

    // Adjust batch size based on processing rate
    let batchSize = requestedLimit || 100;

    if (rate < 10) {
      // Slow consumer - reduce batch size
      batchSize = Math.max(this.MIN_MESSAGES_PER_POLL, Math.floor(batchSize * 0.5));
    } else if (rate > 100 && metrics.lagScore > 50) {
      // Fast consumer with lag - increase batch size
      batchSize = Math.min(
        this.MAX_MESSAGES_PER_POLL,
        Math.floor(batchSize * 1.5),
      );
    }

    return batchSize;
  }

  /**
   * Record consumer poll metrics
   */
  recordPoll(consumerId: string, messagesReceived: number, lagScore: number) {
    const now = Date.now();
    const existing = this.consumerMetrics.get(consumerId);

    if (existing) {
      const timeDiff = (now - existing.lastPollTime) / 1000; // seconds
      const processingRate = timeDiff > 0 ? messagesReceived / timeDiff : 0;

      this.consumerMetrics.set(consumerId, {
        consumerId,
        lastPollTime: now,
        messagesProcessed: messagesReceived,
        processingRate,
        lagScore,
      });
    } else {
      this.consumerMetrics.set(consumerId, {
        consumerId,
        lastPollTime: now,
        messagesProcessed: messagesReceived,
        processingRate: 0,
        lagScore,
      });
    }
  }

  /**
   * Check if consumer should be throttled
   */
  shouldThrottle(consumerId: string): boolean {
    const metrics = this.consumerMetrics.get(consumerId);

    if (!metrics) {
      return false;
    }

    // Throttle if polling too frequently
    const timeSinceLastPoll = Date.now() - metrics.lastPollTime;
    if (timeSinceLastPoll < this.POLL_INTERVAL_MS) {
      return true;
    }

    // Throttle if processing rate is very low (< 1 msg/sec)
    if (metrics.processingRate < 1 && metrics.messagesProcessed > 0) {
      return true;
    }

    return false;
  }

  /**
   * Get recommended poll delay in milliseconds
   */
  getRecommendedDelay(consumerId: string): number {
    const metrics = this.consumerMetrics.get(consumerId);

    if (!metrics) {
      return this.POLL_INTERVAL_MS;
    }

    // Fast consumer with no lag - can poll more frequently
    if (metrics.processingRate > 100 && metrics.lagScore < 20) {
      return 500;
    }

    // Slow consumer - poll less frequently
    if (metrics.processingRate < 10) {
      return 5000;
    }

    return this.POLL_INTERVAL_MS;
  }

  /**
   * Clean up old consumer metrics
   */
  cleanup(olderThanMs: number = 300000) {
    // Default: 5 minutes
    const now = Date.now();

    for (const [consumerId, metrics] of this.consumerMetrics.entries()) {
      if (now - metrics.lastPollTime > olderThanMs) {
        this.consumerMetrics.delete(consumerId);
      }
    }
  }

  /**
   * Get all consumer metrics
   */
  getMetrics(): ConsumerMetrics[] {
    return Array.from(this.consumerMetrics.values());
  }
}
