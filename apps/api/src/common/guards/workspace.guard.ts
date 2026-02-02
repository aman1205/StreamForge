import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = request.params.workspaceId || request.body.workspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID is required');
    }

    // Check if user has access to the workspace
    const member = await this.prisma.workspaceMember.findFirst({
      where: {
        userId: user.id,
        workspaceId,
      },
      include: {
        workspace: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Workspace not found or access denied');
    }

    // Attach workspace and role to request
    request.workspace = member.workspace;
    request.workspaceRole = member.role;

    return true;
  }
}
