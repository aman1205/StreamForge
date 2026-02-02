import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { DlqService } from './dlq.service';
import { SendToDlqDto } from './dto/send-to-dlq.dto';
import { RetryDlqMessageDto } from './dto/retry-dlq-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DlqStatus } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard)
export class DlqController {
  constructor(private dlqService: DlqService) {}

  // Send message to DLQ
  @Post('dlq')
  async sendToDlq(@Body() dto: SendToDlqDto) {
    return this.dlqService.sendToDlq(dto);
  }

  // Get DLQ messages for a topic
  @Get('topics/:topicId/dlq')
  async findByTopic(
    @Param('topicId') topicId: string,
    @Query('status') status?: DlqStatus,
  ) {
    return this.dlqService.findByTopic(topicId, status);
  }

  // Get DLQ messages for a consumer group
  @Get('consumer-groups/:consumerGroupId/dlq')
  async findByConsumerGroup(
    @Param('consumerGroupId') consumerGroupId: string,
    @Query('status') status?: DlqStatus,
  ) {
    return this.dlqService.findByConsumerGroup(consumerGroupId, status);
  }

  // Get DLQ message details
  @Get('dlq/:id')
  async findOne(@Param('id') id: string) {
    return this.dlqService.findOne(id);
  }

  // Retry a specific DLQ message
  @Post('dlq/:id/retry')
  async retry(@Param('id') id: string, @Body() dto: RetryDlqMessageDto) {
    return this.dlqService.retry(id, dto);
  }

  // Retry all pending DLQ messages for a topic
  @Post('topics/:topicId/dlq/retry-all')
  async retryAll(@Param('topicId') topicId: string) {
    return this.dlqService.retryAll(topicId);
  }

  // Mark message as resolved
  @Patch('dlq/:id/resolve')
  async resolve(@Param('id') id: string) {
    return this.dlqService.resolve(id);
  }

  // Delete a DLQ message
  @Delete('dlq/:id')
  async delete(@Param('id') id: string) {
    return this.dlqService.delete(id);
  }

  // Purge resolved DLQ messages
  @Delete('topics/:topicId/dlq/purge')
  async purge(
    @Param('topicId') topicId: string,
    @Query('olderThanDays') olderThanDays?: string,
  ) {
    const days = olderThanDays ? parseInt(olderThanDays) : undefined;
    return this.dlqService.purge(topicId, days);
  }

  // Get DLQ statistics
  @Get('topics/:topicId/dlq/stats')
  async getStats(@Param('topicId') topicId: string) {
    return this.dlqService.getStats(topicId);
  }
}
