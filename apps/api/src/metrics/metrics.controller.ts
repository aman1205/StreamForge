import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  UseGuards,
  Body,
  Post,
} from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MetricType } from '@prisma/client';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  /**
   * Get usage summary for a workspace
   */
  @Get('workspaces/:workspaceId/metrics/summary')
  async getWorkspaceSummary(
    @Param('workspaceId') workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('metricType') metricType?: MetricType,
  ) {
    return this.metricsService.getWorkspaceSummary(workspaceId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      metricType,
    });
  }

  /**
   * Get usage metrics for a topic
   */
  @Get('topics/:topicId/metrics/summary')
  async getTopicSummary(
    @Param('topicId') topicId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.metricsService.getTopicSummary(topicId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * Get time series metrics
   */
  @Get('workspaces/:workspaceId/metrics/timeseries')
  async getTimeSeries(
    @Param('workspaceId') workspaceId: string,
    @Query('metricType') metricType: MetricType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interval') interval?: 'hour' | 'day' | 'month',
  ) {
    if (!metricType) {
      throw new Error('metricType is required');
    }

    return this.metricsService.getTimeSeries(workspaceId, metricType, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      interval,
    });
  }

  /**
   * Calculate billing
   */
  @Post('workspaces/:workspaceId/metrics/billing')
  async calculateBilling(
    @Param('workspaceId') workspaceId: string,
    @Body()
    body: {
      startDate: string;
      endDate: string;
      pricing?: {
        eventsPublished?: number;
        eventsConsumed?: number;
        bandwidthIn?: number;
        bandwidthOut?: number;
        apiRequests?: number;
        storage?: number;
      };
    },
  ) {
    const pricing = {
      eventsPublished: body.pricing?.eventsPublished || 0.01, // $0.01 per 1000 events
      eventsConsumed: body.pricing?.eventsConsumed || 0.005,
      bandwidthIn: body.pricing?.bandwidthIn || 0.1, // $0.1 per GB
      bandwidthOut: body.pricing?.bandwidthOut || 0.15,
      apiRequests: body.pricing?.apiRequests || 0.005, // $0.005 per 1000 requests
      storage: body.pricing?.storage || 0.25, // $0.25 per GB per month
    };

    return this.metricsService.calculateBilling(
      workspaceId,
      new Date(body.startDate),
      new Date(body.endDate),
      pricing,
    );
  }

  /**
   * Get top consumers by metric
   */
  @Get('workspaces/:workspaceId/metrics/top-consumers')
  async getTopConsumers(
    @Param('workspaceId') workspaceId: string,
    @Query('metricType') metricType: MetricType,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!metricType) {
      throw new Error('metricType is required');
    }

    return this.metricsService.getTopConsumers(workspaceId, metricType, {
      limit: limit ? parseInt(limit) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * Clean up old metrics
   */
  @Delete('metrics/cleanup')
  async cleanup(@Query('olderThanDays') olderThanDays?: string) {
    return this.metricsService.cleanup(
      olderThanDays ? parseInt(olderThanDays) : undefined,
    );
  }
}
