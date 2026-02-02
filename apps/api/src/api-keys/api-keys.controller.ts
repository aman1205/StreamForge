import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post('workspaces/:workspaceId/api-keys')
  @UseGuards(WorkspaceGuard)
  async create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.create(workspaceId, dto);
  }

  @Get('workspaces/:workspaceId/api-keys')
  @UseGuards(WorkspaceGuard)
  async findAll(@Param('workspaceId') workspaceId: string) {
    return this.apiKeysService.findByWorkspace(workspaceId);
  }

  @Delete('api-keys/:id')
  async delete(@Param('id') id: string) {
    return this.apiKeysService.delete(id);
  }
}
