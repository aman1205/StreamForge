import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GrantAclDto } from './dto/grant-acl.dto';
import { Permission } from '@prisma/client';

@Injectable()
export class AclsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Grant permission to a user or API key on a topic
   */
  async grant(topicId: string, createdBy: string, dto: GrantAclDto) {
    // Verify topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Validate that either userId or apiKeyId is provided
    if (!dto.userId && !dto.apiKeyId) {
      throw new BadRequestException(
        'Either userId or apiKeyId must be provided',
      );
    }

    if (dto.userId && dto.apiKeyId) {
      throw new BadRequestException(
        'Cannot grant ACL to both user and API key simultaneously',
      );
    }

    // Check if ACL already exists
    const existing = await this.prisma.topicAcl.findFirst({
      where: {
        topicId,
        userId: dto.userId || null,
        apiKeyId: dto.apiKeyId || null,
        permission: dto.permission,
      },
    });

    if (existing) {
      throw new BadRequestException('ACL already exists');
    }

    // Create ACL
    const acl = await this.prisma.topicAcl.create({
      data: {
        topicId,
        userId: dto.userId || null,
        apiKeyId: dto.apiKeyId || null,
        permission: dto.permission,
        createdBy,
      },
    });

    return acl;
  }

  /**
   * Get all ACLs for a topic
   */
  async findByTopic(topicId: string) {
    return this.prisma.topicAcl.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all ACLs for a user
   */
  async findByUser(userId: string) {
    return this.prisma.topicAcl.findMany({
      where: { userId },
      include: {
        topic: true,
      },
    });
  }

  /**
   * Get all ACLs for an API key
   */
  async findByApiKey(apiKeyId: string) {
    return this.prisma.topicAcl.findMany({
      where: { apiKeyId },
      include: {
        topic: true,
      },
    });
  }

  /**
   * Check if user has permission on topic
   */
  async checkUserPermission(
    userId: string,
    topicId: string,
    requiredPermission: Permission,
  ): Promise<boolean> {
    // Check if user is workspace owner/admin (they have all permissions)
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!topic) {
      return false;
    }

    const member = topic.workspace.members[0];
    if (member && (member.role === 'OWNER' || member.role === 'ADMIN')) {
      return true;
    }

    // Check ACLs
    const acl = await this.prisma.topicAcl.findFirst({
      where: {
        topicId,
        userId,
        permission: requiredPermission,
      },
    });

    return !!acl;
  }

  /**
   * Check if API key has permission on topic
   */
  async checkApiKeyPermission(
    apiKeyId: string,
    topicId: string,
    requiredPermission: Permission,
  ): Promise<boolean> {
    const acl = await this.prisma.topicAcl.findFirst({
      where: {
        topicId,
        apiKeyId,
        permission: requiredPermission,
      },
    });

    return !!acl;
  }

  /**
   * Revoke permission
   */
  async revoke(aclId: string) {
    const acl = await this.prisma.topicAcl.findUnique({
      where: { id: aclId },
    });

    if (!acl) {
      throw new NotFoundException('ACL not found');
    }

    await this.prisma.topicAcl.delete({
      where: { id: aclId },
    });

    return { success: true };
  }

  /**
   * Revoke all permissions for a user on a topic
   */
  async revokeAllForUser(topicId: string, userId: string) {
    const result = await this.prisma.topicAcl.deleteMany({
      where: {
        topicId,
        userId,
      },
    });

    return {
      success: true,
      revoked: result.count,
    };
  }

  /**
   * Revoke all permissions for an API key on a topic
   */
  async revokeAllForApiKey(topicId: string, apiKeyId: string) {
    const result = await this.prisma.topicAcl.deleteMany({
      where: {
        topicId,
        apiKeyId,
      },
    });

    return {
      success: true,
      revoked: result.count,
    };
  }

  /**
   * Get permission summary for a topic
   */
  async getPermissionSummary(topicId: string) {
    const acls = await this.findByTopic(topicId);

    const summary = {
      total: acls.length,
      byPermission: {} as Record<Permission, number>,
      users: acls.filter((acl) => acl.userId).length,
      apiKeys: acls.filter((acl) => acl.apiKeyId).length,
    };

    // Count by permission type
    for (const permission of Object.values(Permission)) {
      summary.byPermission[permission] = acls.filter(
        (acl) => acl.permission === permission,
      ).length;
    }

    return summary;
  }
}
