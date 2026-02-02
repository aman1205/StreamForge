import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditAction } from '@prisma/client';

export interface AuditLogOptions {
  workspaceId?: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async log(options: AuditLogOptions) {
    return this.prisma.auditLog.create({
      data: {
        workspaceId: options.workspaceId || null,
        userId: options.userId || null,
        action: options.action,
        resource: options.resource,
        resourceId: options.resourceId || null,
        metadata: options.metadata || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      },
    });
  }

  /**
   * Get audit logs for a workspace
   */
  async findByWorkspace(
    workspaceId: string,
    options: {
      limit?: number;
      offset?: number;
      action?: AuditAction;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const where: any = { workspaceId };

    if (options.action) {
      where.action = options.action;
    }

    if (options.userId) {
      where.userId = options.userId;
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit: options.limit || 50,
      offset: options.offset || 0,
    };
  }

  /**
   * Get audit logs for a user
   */
  async findByUser(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      action?: AuditAction;
    } = {},
  ) {
    const where: any = { userId };

    if (options.action) {
      where.action = options.action;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit: options.limit || 50,
      offset: options.offset || 0,
    };
  }

  /**
   * Get audit logs for a specific resource
   */
  async findByResource(
    resource: string,
    resourceId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const where = { resource, resourceId };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit: options.limit || 50,
      offset: options.offset || 0,
    };
  }

  /**
   * Get audit statistics
   */
  async getStats(workspaceId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Count by action
    const byAction: Record<string, number> = {};
    logs.forEach((log) => {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
    });

    // Count by resource
    const byResource: Record<string, number> = {};
    logs.forEach((log) => {
      byResource[log.resource] = (byResource[log.resource] || 0) + 1;
    });

    // Count by day
    const byDay: Record<string, number> = {};
    logs.forEach((log) => {
      const day = log.createdAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return {
      total: logs.length,
      byAction,
      byResource,
      byDay,
      period: `Last ${days} days`,
    };
  }

  /**
   * Clean up old audit logs
   */
  async cleanup(olderThanDays: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      success: true,
      deleted: result.count,
    };
  }

  /**
   * Export audit logs as JSON
   */
  async export(
    workspaceId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      action?: AuditAction;
    } = {},
  ) {
    const where: any = { workspaceId };

    if (options.action) {
      where.action = options.action;
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return logs;
  }
}
