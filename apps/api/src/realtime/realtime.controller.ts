import { Controller, Get, UseGuards } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/realtime')
@UseGuards(JwtAuthGuard)
export class RealtimeController {
  constructor(private realtimeGateway: RealtimeGateway) {}

  /**
   * Get WebSocket connection statistics
   */
  @Get('stats')
  getStats() {
    return this.realtimeGateway.getStats();
  }
}
