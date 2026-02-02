import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { PublishEventDto } from './dto/publish-event.dto';
import { ConsumeEventsDto } from './dto/consume-events.dto';
import { ConsumeFromGroupDto } from './dto/consume-from-group.dto';
import { AcknowledgeMessageDto } from './dto/acknowledge-message.dto';
import { NackMessageDto } from './dto/nack-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post('topics/:topicId/publish')
  async publish(
    @Param('topicId') topicId: string,
    @Body() dto: PublishEventDto,
  ) {
    return this.eventsService.publish(topicId, dto);
  }

  @Get('topics/:topicId/consume')
  async consume(
    @Param('topicId') topicId: string,
    @Query() dto: ConsumeEventsDto,
  ) {
    // Convert query params to proper types
    const parsedDto: ConsumeEventsDto = {
      offset: dto.offset,
      limit: dto.limit ? parseInt(dto.limit as any) : undefined,
      partition: dto.partition ? parseInt(dto.partition as any) : undefined,
    };

    return this.eventsService.consume(topicId, parsedDto);
  }

  @Post('consumer-groups/:consumerGroupId/consume')
  async consumeFromGroup(
    @Param('consumerGroupId') consumerGroupId: string,
    @Body() dto: ConsumeFromGroupDto,
  ) {
    return this.eventsService.consumeFromGroup(consumerGroupId, dto);
  }

  @Post('consumer-groups/:consumerGroupId/ack')
  async acknowledgeMessages(
    @Param('consumerGroupId') consumerGroupId: string,
    @Body() dto: AcknowledgeMessageDto,
  ) {
    return this.eventsService.acknowledgeMessages(consumerGroupId, dto);
  }

  @Post('consumer-groups/:consumerGroupId/nack')
  async nackMessage(
    @Param('consumerGroupId') consumerGroupId: string,
    @Body() dto: NackMessageDto,
  ) {
    return this.eventsService.nackMessage(consumerGroupId, dto);
  }

  @Delete('acknowledgments/cleanup')
  async cleanupExpiredAcknowledgments() {
    return this.eventsService.cleanupExpiredAcknowledgments();
  }
}
