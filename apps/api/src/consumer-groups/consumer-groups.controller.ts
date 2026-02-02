import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import { ConsumerGroupsService } from './consumer-groups.service';
import { CreateConsumerGroupDto } from './dto/create-consumer-group.dto';
import { RegisterConsumerDto } from './dto/register-consumer.dto';
import { CommitOffsetDto } from './dto/commit-offset.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ConsumerGroupsController {
  constructor(private consumerGroupsService: ConsumerGroupsService) {}

  // Create consumer group for a topic
  @Post('topics/:topicId/consumer-groups')
  async create(
    @Param('topicId') topicId: string,
    @Body() dto: CreateConsumerGroupDto,
  ) {
    return this.consumerGroupsService.create(topicId, dto);
  }

  // List consumer groups for a topic
  @Get('topics/:topicId/consumer-groups')
  async findByTopic(@Param('topicId') topicId: string) {
    return this.consumerGroupsService.findByTopic(topicId);
  }

  // Get consumer group details
  @Get('consumer-groups/:id')
  async findOne(@Param('id') id: string) {
    return this.consumerGroupsService.findOne(id);
  }

  // Register/join a consumer to the group
  @Post('consumer-groups/:id/consumers')
  async registerConsumer(
    @Param('id') consumerGroupId: string,
    @Body() dto: RegisterConsumerDto,
  ) {
    return this.consumerGroupsService.registerConsumer(consumerGroupId, dto);
  }

  // Send heartbeat
  @Patch('consumer-groups/:id/consumers/:consumerId/heartbeat')
  async heartbeat(
    @Param('id') consumerGroupId: string,
    @Param('consumerId') consumerId: string,
  ) {
    return this.consumerGroupsService.heartbeat(consumerGroupId, consumerId);
  }

  // Unregister consumer from group
  @Delete('consumer-groups/:id/consumers/:consumerId')
  async unregisterConsumer(
    @Param('id') consumerGroupId: string,
    @Param('consumerId') consumerId: string,
  ) {
    return this.consumerGroupsService.unregisterConsumer(consumerGroupId, consumerId);
  }

  // Commit offset
  @Post('consumer-groups/:id/offsets')
  async commitOffset(
    @Param('id') consumerGroupId: string,
    @Body() dto: CommitOffsetDto,
  ) {
    return this.consumerGroupsService.commitOffset(consumerGroupId, dto);
  }

  // Get offsets
  @Get('consumer-groups/:id/offsets')
  async getOffsets(@Param('id') consumerGroupId: string) {
    return this.consumerGroupsService.getOffsets(consumerGroupId);
  }

  // Reset offset to specific position
  @Patch('consumer-groups/:id/offsets/:partition')
  async resetOffset(
    @Param('id') consumerGroupId: string,
    @Param('partition') partition: string,
    @Query('offset') offset: string,
  ) {
    return this.consumerGroupsService.resetOffset(
      consumerGroupId,
      parseInt(partition),
      offset,
    );
  }

  // Get consumer lag
  @Get('consumer-groups/:id/lag')
  async getLag(@Param('id') consumerGroupId: string) {
    return this.consumerGroupsService.getLag(consumerGroupId);
  }

  // Delete consumer group
  @Delete('consumer-groups/:id')
  async delete(@Param('id') consumerGroupId: string) {
    return this.consumerGroupsService.delete(consumerGroupId);
  }
}
