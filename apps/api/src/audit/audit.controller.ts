import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditAction } from '@prisma/client';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  /**
   * Get audit logs for a workspace
   */
  @Get('workspaces/:workspaceId/audit-logs')
  async getWorkspaceLogs(
    @Param('workspaceId') workspaceId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('action') action?: AuditAction,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.findByWorkspace(workspaceId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      action,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * Get audit statistics for a workspace
   */
  @Get('workspaces/:workspaceId/audit-logs/stats')
  async getStats(
    @Param('workspaceId') workspaceId: string,
    @Query('days') days?: string,
  ) {
    return this.auditService.getStats(
      workspaceId,
      days ? parseInt(days) : undefined,
    );
  }

  /**
   * Export audit logs
   */
  @Get('workspaces/:workspaceId/audit-logs/export')
  async export(
    @Param('workspaceId') workspaceId: string,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.export(workspaceId, {
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * Get audit logs for a specific resource
   */
  @Get('audit-logs/:resource/:resourceId')
  async getResourceLogs(
    @Param('resource') resource: string,
    @Param('resourceId') resourceId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.findByResource(resource, resourceId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  /**
   * Clean up old audit logs (admin only)
   */
  @Delete('audit-logs/cleanup')
  async cleanup(@Query('olderThanDays') olderThanDays?: string) {
    return this.auditService.cleanup(
      olderThanDays ? parseInt(olderThanDays) : undefined,
    );
  }
}
