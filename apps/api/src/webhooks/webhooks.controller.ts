import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  /**
   * Create a new webhook for a topic
   */
  @Post('topics/:topicId/webhooks')
  async create(
    @Param('topicId') topicId: string,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhooksService.create(topicId, dto);
  }

  /**
   * Get all webhooks for a topic
   */
  @Get('topics/:topicId/webhooks')
  async findByTopic(@Param('topicId') topicId: string) {
    return this.webhooksService.findByTopic(topicId);
  }

  /**
   * Get a specific webhook
   */
  @Get('webhooks/:webhookId')
  async findOne(@Param('webhookId') webhookId: string) {
    return this.webhooksService.findOne(webhookId);
  }

  /**
   * Update a webhook
   */
  @Put('webhooks/:webhookId')
  async update(
    @Param('webhookId') webhookId: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooksService.update(webhookId, dto);
  }

  /**
   * Delete a webhook
   */
  @Delete('webhooks/:webhookId')
  async delete(@Param('webhookId') webhookId: string) {
    return this.webhooksService.delete(webhookId);
  }

  /**
   * Get webhook delivery statistics
   */
  @Get('webhooks/:webhookId/stats')
  async getStats(@Param('webhookId') webhookId: string) {
    return this.webhooksService.getStats(webhookId);
  }

  /**
   * Retry failed deliveries
   */
  @Post('webhooks/:webhookId/retry')
  async retryFailed(@Param('webhookId') webhookId: string) {
    return this.webhooksService.retryFailed(webhookId);
  }

  /**
   * Test webhook delivery
   */
  @Post('webhooks/:webhookId/test')
  async test(@Param('webhookId') webhookId: string, @Body() payload: any) {
    await this.webhooksService.deliverEvent(
      webhookId,
      'test-event',
      payload || { test: true, timestamp: new Date().toISOString() },
    );
    return { success: true, message: 'Test event queued for delivery' };
  }
}
