import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

export const AUDIT_LOG = 'auditLog';

export interface AuditMetadata {
  action: AuditAction;
  resource: string;
}

/**
 * Decorator to mark endpoints for automatic audit logging
 * Usage: @AuditLog(AuditAction.TOPIC_CREATED, 'topic')
 */
export const AuditLog = (action: AuditAction, resource: string) =>
  SetMetadata(AUDIT_LOG, { action, resource });
