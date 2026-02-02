import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReplayService } from './replay.service';
import { ReplayEventsDto } from './dto/replay-events.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ReplayController {
  constructor(private replayService: ReplayService) {}

  /**
   * Start a replay session
   */
  @Post('topics/:topicId/replay')
  async startReplay(
    @Param('topicId') topicId: string,
    @Body() dto: ReplayEventsDto,
  ) {
    const sessionId = await this.replayService.startReplay(topicId, dto);
    return {
      success: true,
      sessionId,
      message: 'Replay session started',
    };
  }

  /**
   * Get replay session status
   */
  @Get('replay/:sessionId')
  getSession(@Param('sessionId') sessionId: string) {
    return this.replayService.getSession(sessionId);
  }

  /**
   * Pause replay session
   */
  @Post('replay/:sessionId/pause')
  pauseSession(@Param('sessionId') sessionId: string) {
    return this.replayService.pauseSession(sessionId);
  }

  /**
   * Resume replay session
   */
  @Post('replay/:sessionId/resume')
  resumeSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: ReplayEventsDto,
  ) {
    return this.replayService.resumeSession(sessionId, dto);
  }

  /**
   * Stop replay session
   */
  @Post('replay/:sessionId/stop')
  stopSession(@Param('sessionId') sessionId: string) {
    return this.replayService.stopSession(sessionId);
  }

  /**
   * List replay sessions
   */
  @Get('replay')
  listSessions(@Query('topicId') topicId?: string) {
    return this.replayService.listSessions(topicId);
  }

  /**
   * Create snapshot for point-in-time recovery
   */
  @Post('topics/:topicId/snapshots')
  async createSnapshot(
    @Param('topicId') topicId: string,
    @Body('name') name: string,
  ) {
    return this.replayService.createSnapshot(topicId, name);
  }

  /**
   * Get event count between offsets
   */
  @Get('topics/:topicId/event-count')
  async getEventCount(
    @Param('topicId') topicId: string,
    @Query('fromOffset') fromOffset: string,
    @Query('toOffset') toOffset?: string,
  ) {
    const count = await this.replayService.getEventCount(
      topicId,
      fromOffset,
      toOffset,
    );
    return { count };
  }

  /**
   * Cleanup old sessions
   */
  @Delete('replay/cleanup')
  cleanup(@Query('olderThanMinutes') olderThanMinutes?: string) {
    return this.replayService.cleanup(
      olderThanMinutes ? parseInt(olderThanMinutes) : undefined,
    );
  }
}
