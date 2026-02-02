import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AclsService } from './acls.service';
import { Permission } from '@prisma/client';

export const REQUIRE_PERMISSION = 'requirePermission';

/**
 * Decorator to require specific permission on a topic
 * Usage: @RequirePermission(Permission.READ)
 */
export const RequirePermission = (permission: Permission) =>
  Reflect.metadata(REQUIRE_PERMISSION, permission);

@Injectable()
export class AclGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private aclsService: AclsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<Permission>(
      REQUIRE_PERMISSION,
      context.getHandler(),
    );

    if (!requiredPermission) {
      // No permission required, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const topicId = request.params.topicId;

    if (!topicId) {
      throw new ForbiddenException('Topic ID not found in request');
    }

    if (!user || !user.sub) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has required permission
    const hasPermission = await this.aclsService.checkUserPermission(
      user.sub,
      topicId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You don't have ${requiredPermission} permission on this topic`,
      );
    }

    return true;
  }
}
