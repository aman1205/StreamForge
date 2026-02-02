import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreateApiKeyDto) {
    // Generate a secure API key
    const plainKey = this.generateApiKey();

    // Hash the key before storing
    const hashedKey = await bcrypt.hash(plainKey, 10);

    // Create API key in database
    const apiKey = await this.prisma.apiKey.create({
      data: {
        workspaceId,
        name: dto.name,
        key: hashedKey,
        permissions: dto.permissions || {},
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    // Return API key with plain key (only time it's shown)
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: plainKey, // Return plain key only on creation
      permissions: apiKey.permissions,
      active: apiKey.active,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
    };
  }

  async findByWorkspace(workspaceId: string) {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        permissions: true,
        active: true,
        createdAt: true,
        expiresAt: true,
        // Don't include the hashed key
      },
    });

    return apiKeys;
  }

  async revoke(apiKeyId: string) {
    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { active: false },
    });

    return { success: true };
  }

  async delete(apiKeyId: string) {
    await this.prisma.apiKey.delete({
      where: { id: apiKeyId },
    });

    return { success: true };
  }

  async validateApiKey(plainKey: string) {
    // In a real implementation, we'd need a way to find the key
    // For now, we'd need to store a prefix or hash that allows lookup
    // This is a simplified version
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { active: true },
    });

    for (const apiKey of apiKeys) {
      const isValid = await bcrypt.compare(plainKey, apiKey.key);
      if (isValid) {
        // Check expiration
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
          return null;
        }
        return apiKey;
      }
    }

    return null;
  }

  private generateApiKey(): string {
    // Generate a secure random key
    // Format: sf_live_xxxxxxxxxxxxxxxxxxxxxx (sf = streamforge)
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `sf_live_${randomBytes}`;
  }
}
