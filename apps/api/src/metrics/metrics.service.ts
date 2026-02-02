import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { MetricType } from '@prisma/client';

export interface RecordMetricOptions {
  workspaceId: string;
  topicId?: string;
  metricType: MetricType;
  value: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record a usage metric
   */
  async record(options: RecordMetricOptions) {
    return this.prisma.usageMetric.create({
      data: {
        workspaceId: options.workspaceId,
        topicId: options.topicId || null,
        metricType: options.metricType,
        value: BigInt(options.value),
        metadata: options.metadata || null,
      },
    });
  }

  /**
   * Record multiple metrics in batch
   */
  async recordBatch(metrics: RecordMetricOptions[]) {
    return this.prisma.usageMetric.createMany({
      data: metrics.map((m) => ({
        workspaceId: m.workspaceId,
        topicId: m.topicId || null,
        metricType: m.metricType,
        value: BigInt(m.value),
        metadata: m.metadata || null,
      })),
    });
  }

  /**
   * Get usage summary for a workspace
   */
  async getWorkspaceSummary(
    workspaceId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      metricType?: MetricType;
    } = {},
  ) {
    const where: any = { workspaceId };

    if (options.metricType) {
      where.metricType = options.metricType;
    }

    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) {
        where.timestamp.gte = options.startDate;
      }
      if (options.endDate) {
        where.timestamp.lte = options.endDate;
      }
    }

    // Get metrics grouped by type
    const metrics = await this.prisma.usageMetric.groupBy({
      by: ['metricType'],
      where,
      _sum: {
        value: true,
      },
      _count: true,
    });

    const summary: Record<string, any> = {};

    metrics.forEach((metric) => {
      summary[metric.metricType] = {
        total: Number(metric._sum.value || 0),
        count: metric._count,
      };
    });

    return summary;
  }

  /**
   * Get usage metrics for a topic
   */
  async getTopicSummary(
    topicId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const where: any = { topicId };

    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) {
        where.timestamp.gte = options.startDate;
      }
      if (options.endDate) {
        where.timestamp.lte = options.endDate;
      }
    }

    const metrics = await this.prisma.usageMetric.groupBy({
      by: ['metricType'],
      where,
      _sum: {
        value: true,
      },
    });

    const summary: Record<string, number> = {};

    metrics.forEach((metric) => {
      summary[metric.metricType] = Number(metric._sum.value || 0);
    });

    return summary;
  }

  /**
   * Get detailed metrics over time
   */
  async getTimeSeries(
    workspaceId: string,
    metricType: MetricType,
    options: {
      startDate?: Date;
      endDate?: Date;
      interval?: 'hour' | 'day' | 'month';
    } = {},
  ) {
    const where: any = {
      workspaceId,
      metricType,
    };

    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) {
        where.timestamp.gte = options.startDate;
      }
      if (options.endDate) {
        where.timestamp.lte = options.endDate;
      }
    }

    const metrics = await this.prisma.usageMetric.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });

    // Group by interval
    const grouped: Record<string, number> = {};

    metrics.forEach((metric) => {
      let key: string;

      switch (options.interval || 'day') {
        case 'hour':
          key = metric.timestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH
          break;
        case 'day':
          key = metric.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'month':
          key = metric.timestamp.toISOString().substring(0, 7); // YYYY-MM
          break;
      }

      grouped[key] = (grouped[key] || 0) + Number(metric.value);
    });

    return Object.entries(grouped).map(([timestamp, value]) => ({
      timestamp,
      value,
    }));
  }

  /**
   * Get billing calculation
   */
  async calculateBilling(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
    pricing: {
      eventsPublished: number; // Price per 1000 events
      eventsConsumed: number;
      bandwidthIn: number; // Price per GB
      bandwidthOut: number;
      apiRequests: number; // Price per 1000 requests
      storage: number; // Price per GB per month
    },
  ) {
    const summary = await this.getWorkspaceSummary(workspaceId, {
      startDate,
      endDate,
    });

    const costs = {
      eventsPublished:
        (summary[MetricType.EVENTS_PUBLISHED]?.total || 0) /
        1000 *
        pricing.eventsPublished,
      eventsConsumed:
        (summary[MetricType.EVENTS_CONSUMED]?.total || 0) /
        1000 *
        pricing.eventsConsumed,
      bandwidthIn:
        (summary[MetricType.BANDWIDTH_IN]?.total || 0) /
        (1024 * 1024 * 1024) *
        pricing.bandwidthIn,
      bandwidthOut:
        (summary[MetricType.BANDWIDTH_OUT]?.total || 0) /
        (1024 * 1024 * 1024) *
        pricing.bandwidthOut,
      apiRequests:
        (summary[MetricType.API_REQUESTS]?.total || 0) /
        1000 *
        pricing.apiRequests,
      storage:
        (summary[MetricType.STORAGE_USED]?.total || 0) /
        (1024 * 1024 * 1024) *
        pricing.storage,
    };

    const total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      usage: summary,
      costs,
      total: parseFloat(total.toFixed(2)),
      currency: 'USD',
    };
  }

  /**
   * Get top consumers by metric
   */
  async getTopConsumers(
    workspaceId: string,
    metricType: MetricType,
    options: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const where: any = {
      workspaceId,
      metricType,
      topicId: { not: null },
    };

    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) {
        where.timestamp.gte = options.startDate;
      }
      if (options.endDate) {
        where.timestamp.lte = options.endDate;
      }
    }

    const metrics = await this.prisma.usageMetric.groupBy({
      by: ['topicId'],
      where,
      _sum: {
        value: true,
      },
      orderBy: {
        _sum: {
          value: 'desc',
        },
      },
      take: options.limit || 10,
    });

    // Get topic names
    const topicIds = metrics
      .map((m) => m.topicId)
      .filter((id): id is string => id !== null);

    const topics = await this.prisma.topic.findMany({
      where: {
        id: { in: topicIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const topicMap = new Map(topics.map((t) => [t.id, t.name]));

    return metrics.map((metric) => ({
      topicId: metric.topicId,
      topicName: metric.topicId ? topicMap.get(metric.topicId) : null,
      value: Number(metric._sum.value || 0),
    }));
  }

  /**
   * Clean up old metrics
   */
  async cleanup(olderThanDays: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.usageMetric.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return {
      success: true,
      deleted: result.count,
    };
  }
}
