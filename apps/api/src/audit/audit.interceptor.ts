import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { AUDIT_LOG, AuditMetadata } from './audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_LOG,
      context.getHandler(),
    );

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      tap(async (result) => {
        // Extract workspace and resource IDs from request/response
        const workspaceId = request.params.workspaceId || result?.workspaceId;
        const resourceId =
          request.params.topicId ||
          request.params.id ||
          result?.id ||
          result?.topicId;

        // Log the action
        await this.auditService.log({
          workspaceId,
          userId: user?.sub,
          action: auditMetadata.action,
          resource: auditMetadata.resource,
          resourceId,
          metadata: {
            method: request.method,
            url: request.url,
            body: request.body,
          },
          ipAddress: request.ip || request.connection.remoteAddress,
          userAgent: request.headers['user-agent'],
        });
      }),
    );
  }
}
