import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private topicsService: TopicsService) {}

  @Post('workspaces/:workspaceId/topics')
  @UseGuards(WorkspaceGuard)
  async create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateTopicDto,
  ) {
    return this.topicsService.create(workspaceId, dto);
  }

  @Get('workspaces/:workspaceId/topics')
  @UseGuards(WorkspaceGuard)
  async findAll(@Param('workspaceId') workspaceId: string) {
    return this.topicsService.findByWorkspace(workspaceId);
  }

  @Get('topics/:id')
  async findOne(@Param('id') id: string) {
    return this.topicsService.findOne(id);
  }

  @Delete('topics/:id')
  async delete(@Param('id') id: string) {
    return this.topicsService.delete(id);
  }
}
