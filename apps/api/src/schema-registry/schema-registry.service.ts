import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateSchemaDto } from './dto/create-schema.dto';
import { UpdateSchemaDto } from './dto/update-schema.dto';
import { SchemaFormat } from '@prisma/client';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

@Injectable()
export class SchemaRegistryService {
  private ajv: Ajv;

  constructor(private prisma: PrismaService) {
    // Initialize Ajv for JSON Schema validation
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  /**
   * Create a new schema version for a topic
   */
  async createSchema(topicId: string, userId: string, dto: CreateSchemaDto) {
    // Verify topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Validate schema format
    if (dto.format === SchemaFormat.JSON_SCHEMA) {
      try {
        this.ajv.compile(dto.schema);
      } catch (error) {
        throw new BadRequestException(
          `Invalid JSON Schema: ${error.message}`,
        );
      }
    }

    // Get next version number
    const latestVersion = await this.prisma.schemaVersion.findFirst({
      where: { topicId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    // Deactivate previous active schemas
    await this.prisma.schemaVersion.updateMany({
      where: {
        topicId,
        active: true,
      },
      data: { active: false },
    });

    // Create new schema version
    const schemaVersion = await this.prisma.schemaVersion.create({
      data: {
        topicId,
        version: nextVersion,
        format: dto.format || SchemaFormat.JSON_SCHEMA,
        schema: dto.schema,
        description: dto.description,
        createdBy: userId,
        active: true,
      },
    });

    return schemaVersion;
  }

  /**
   * Get all schema versions for a topic
   */
  async findByTopic(topicId: string) {
    return this.prisma.schemaVersion.findMany({
      where: { topicId },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Get active schema for a topic
   */
  async findActiveSchema(topicId: string) {
    const schema = await this.prisma.schemaVersion.findFirst({
      where: {
        topicId,
        active: true,
      },
      orderBy: { version: 'desc' },
    });

    if (!schema) {
      throw new NotFoundException('No active schema found for this topic');
    }

    return schema;
  }

  /**
   * Get specific schema version
   */
  async findOne(topicId: string, version: number) {
    const schema = await this.prisma.schemaVersion.findUnique({
      where: {
        topicId_version: {
          topicId,
          version,
        },
      },
    });

    if (!schema) {
      throw new NotFoundException('Schema version not found');
    }

    return schema;
  }

  /**
   * Update schema (activate/deactivate)
   */
  async update(topicId: string, version: number, dto: UpdateSchemaDto) {
    const schema = await this.findOne(topicId, version);

    // If activating this version, deactivate others
    if (dto.active === true) {
      await this.prisma.schemaVersion.updateMany({
        where: {
          topicId,
          active: true,
          version: { not: version },
        },
        data: { active: false },
      });
    }

    return this.prisma.schemaVersion.update({
      where: { id: schema.id },
      data: dto,
    });
  }

  /**
   * Validate payload against topic's active schema
   */
  async validatePayload(topicId: string, payload: any): Promise<boolean> {
    const schema = await this.findActiveSchema(topicId);

    if (schema.format !== SchemaFormat.JSON_SCHEMA) {
      throw new BadRequestException(
        `Schema format ${schema.format} validation not implemented`,
      );
    }

    const validate = this.ajv.compile(schema.schema as any);
    const valid = validate(payload);

    if (!valid) {
      const errors = validate.errors
        ?.map((err) => `${err.instancePath} ${err.message}`)
        .join(', ');
      throw new BadRequestException(`Schema validation failed: ${errors}`);
    }

    return true;
  }

  /**
   * Check schema compatibility (for evolution)
   */
  async checkCompatibility(
    topicId: string,
    newSchema: Record<string, any>,
  ): Promise<{
    compatible: boolean;
    issues: string[];
  }> {
    const activeSchema = await this.findActiveSchema(topicId);

    // Basic compatibility check for JSON Schema
    const issues: string[] = [];

    // Check if required fields were added (breaking change)
    const oldRequired = (activeSchema.schema as any).required || [];
    const newRequired = newSchema.required || [];

    const addedRequired = newRequired.filter(
      (field: string) => !oldRequired.includes(field),
    );

    if (addedRequired.length > 0) {
      issues.push(
        `Added required fields: ${addedRequired.join(', ')} (breaking change)`,
      );
    }

    // Check if fields were removed (breaking change)
    const oldProperties = Object.keys(
      (activeSchema.schema as any).properties || {},
    );
    const newProperties = Object.keys(newSchema.properties || {});

    const removedFields = oldProperties.filter(
      (field) => !newProperties.includes(field),
    );

    if (removedFields.length > 0) {
      issues.push(
        `Removed fields: ${removedFields.join(', ')} (breaking change)`,
      );
    }

    return {
      compatible: issues.length === 0,
      issues,
    };
  }

  /**
   * Delete schema version (soft delete by deactivating)
   */
  async delete(topicId: string, version: number) {
    const schema = await this.findOne(topicId, version);

    await this.prisma.schemaVersion.update({
      where: { id: schema.id },
      data: { active: false },
    });

    return { success: true };
  }
}
