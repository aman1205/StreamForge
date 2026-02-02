import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhookStatus, DeliveryStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new webhook endpoint
   */
  async create(topicId: string, dto: CreateWebhookDto) {
    // Verify topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const webhook = await this.prisma.webhookEndpoint.create({
      data: {
        topicId,
        name: dto.name,
        url: dto.url,
        secret: dto.secret,
        headers: dto.headers || {},
        filters: dto.filters || null,
        retryPolicy: dto.retryPolicy || { maxRetries: 3, backoffMs: 1000 },
        status: dto.status || WebhookStatus.ACTIVE,
      },
    });

    return webhook;
  }

  /**
   * Get all webhooks for a topic
   */
  async findByTopic(topicId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { topicId },
      include: {
        _count: {
          select: { deliveries: true },
        },
      },
    });
  }

  /**
   * Get a specific webhook
   */
  async findOne(webhookId: string) {
    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id: webhookId },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  /**
   * Update a webhook
   */
  async update(webhookId: string, dto: UpdateWebhookDto) {
    await this.findOne(webhookId);

    return this.prisma.webhookEndpoint.update({
      where: { id: webhookId },
      data: dto,
    });
  }

  /**
   * Delete a webhook
   */
  async delete(webhookId: string) {
    await this.findOne(webhookId);

    await this.prisma.webhookEndpoint.delete({
      where: { id: webhookId },
    });

    return { success: true };
  }

  /**
   * Deliver event to webhook
   */
  async deliverEvent(
    webhookId: string,
    eventId: string,
    payload: any,
  ): Promise<void> {
    const webhook = await this.findOne(webhookId);

    if (webhook.status !== WebhookStatus.ACTIVE) {
      console.log(`Webhook ${webhookId} is not active, skipping delivery`);
      return;
    }

    // Check if event matches filters
    if (webhook.filters && !this.matchesFilters(payload, webhook.filters)) {
      console.log(`Event ${eventId} does not match webhook filters`);
      return;
    }

    // Create delivery record
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        webhookId,
        eventId,
        payload,
        status: DeliveryStatus.PENDING,
      },
    });

    // Attempt delivery
    await this.attemptDelivery(delivery.id);
  }

  /**
   * Attempt to deliver a webhook
   */
  async attemptDelivery(deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const webhook = delivery.webhook;
    const retryPolicy = webhook.retryPolicy as any;

    // Update status to retrying
    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: { status: DeliveryStatus.RETRYING },
    });

    try {
      // Prepare request
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(webhook.headers as any),
      };

      // Add HMAC signature if secret is configured
      if (webhook.secret) {
        const signature = this.generateSignature(
          JSON.stringify(delivery.payload),
          webhook.secret,
        );
        headers['X-Webhook-Signature'] = signature;
      }

      // Send HTTP POST request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.payload),
      });

      const responseText = await response.text();

      if (response.ok) {
        // Success
        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: DeliveryStatus.SUCCESS,
            statusCode: response.status,
            response: responseText.substring(0, 1000), // Truncate
            deliveredAt: new Date(),
          },
        });
      } else {
        // HTTP error
        await this.handleDeliveryFailure(
          deliveryId,
          response.status,
          responseText,
          retryPolicy,
        );
      }
    } catch (error) {
      // Network error
      await this.handleDeliveryFailure(
        deliveryId,
        null,
        error.message,
        retryPolicy,
      );
    }
  }

  /**
   * Handle delivery failure and schedule retry
   */
  private async handleDeliveryFailure(
    deliveryId: string,
    statusCode: number | null,
    error: string,
    retryPolicy: any,
  ) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) return;

    const maxRetries = retryPolicy.maxRetries || 3;

    if (delivery.attempt >= maxRetries) {
      // Max retries reached
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.FAILED,
          statusCode,
          error: error.substring(0, 1000),
        },
      });
    } else {
      // Schedule retry with exponential backoff
      const nextAttempt = delivery.attempt + 1;
      const backoffMs = retryPolicy.backoffMs || 1000;
      const delayMs = backoffMs * Math.pow(2, delivery.attempt);

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: DeliveryStatus.PENDING,
          attempt: nextAttempt,
          statusCode,
          error: error.substring(0, 1000),
        },
      });

      // Schedule retry
      setTimeout(() => {
        this.attemptDelivery(deliveryId);
      }, delayMs);
    }
  }

  /**
   * Check if payload matches webhook filters
   */
  private matchesFilters(payload: any, filters: any): boolean {
    if (!filters || Object.keys(filters).length === 0) {
      return true;
    }

    // Simple equality check for now
    // Can be extended to support operators like $gt, $lt, $regex, etc.
    for (const [key, value] of Object.entries(filters)) {
      const payloadValue = this.getNestedValue(payload, key);

      if (payloadValue !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  /**
   * Generate HMAC signature
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Get webhook delivery statistics
   */
  async getStats(webhookId: string) {
    const [total, pending, success, failed, retrying] = await Promise.all([
      this.prisma.webhookDelivery.count({ where: { webhookId } }),
      this.prisma.webhookDelivery.count({
        where: { webhookId, status: DeliveryStatus.PENDING },
      }),
      this.prisma.webhookDelivery.count({
        where: { webhookId, status: DeliveryStatus.SUCCESS },
      }),
      this.prisma.webhookDelivery.count({
        where: { webhookId, status: DeliveryStatus.FAILED },
      }),
      this.prisma.webhookDelivery.count({
        where: { webhookId, status: DeliveryStatus.RETRYING },
      }),
    ]);

    const successRate = total > 0 ? (success / total) * 100 : 0;

    return {
      total,
      pending,
      success,
      failed,
      retrying,
      successRate: successRate.toFixed(2),
    };
  }

  /**
   * Retry failed deliveries
   */
  async retryFailed(webhookId: string) {
    const failedDeliveries = await this.prisma.webhookDelivery.findMany({
      where: {
        webhookId,
        status: DeliveryStatus.FAILED,
      },
    });

    for (const delivery of failedDeliveries) {
      // Reset attempt counter and retry
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          attempt: 1,
          status: DeliveryStatus.PENDING,
        },
      });

      await this.attemptDelivery(delivery.id);
    }

    return {
      success: true,
      retriedCount: failedDeliveries.length,
    };
  }
}
