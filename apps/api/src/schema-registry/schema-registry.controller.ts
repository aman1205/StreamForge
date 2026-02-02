import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SchemaRegistryService } from './schema-registry.service';
import { CreateSchemaDto } from './dto/create-schema.dto';
import { UpdateSchemaDto } from './dto/update-schema.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class SchemaRegistryController {
  constructor(private schemaRegistryService: SchemaRegistryService) {}

  /**
   * Create new schema version for a topic
   */
  @Post('topics/:topicId/schemas')
  async createSchema(
    @Param('topicId') topicId: string,
    @Body() dto: CreateSchemaDto,
    @Request() req: any,
  ) {
    return this.schemaRegistryService.createSchema(topicId, req.user.sub, dto);
  }

  /**
   * Get all schema versions for a topic
   */
  @Get('topics/:topicId/schemas')
  async getSchemas(@Param('topicId') topicId: string) {
    return this.schemaRegistryService.findByTopic(topicId);
  }

  /**
   * Get active schema for a topic
   */
  @Get('topics/:topicId/schemas/active')
  async getActiveSchema(@Param('topicId') topicId: string) {
    return this.schemaRegistryService.findActiveSchema(topicId);
  }

  /**
   * Get specific schema version
   */
  @Get('topics/:topicId/schemas/:version')
  async getSchema(
    @Param('topicId') topicId: string,
    @Param('version') version: string,
  ) {
    return this.schemaRegistryService.findOne(topicId, parseInt(version));
  }

  /**
   * Update schema (activate/deactivate)
   */
  @Put('topics/:topicId/schemas/:version')
  async updateSchema(
    @Param('topicId') topicId: string,
    @Param('version') version: string,
    @Body() dto: UpdateSchemaDto,
  ) {
    return this.schemaRegistryService.update(topicId, parseInt(version), dto);
  }

  /**
   * Validate payload against active schema
   */
  @Post('topics/:topicId/schemas/validate')
  async validatePayload(
    @Param('topicId') topicId: string,
    @Body() payload: any,
  ) {
    const valid = await this.schemaRegistryService.validatePayload(
      topicId,
      payload,
    );
    return { valid };
  }

  /**
   * Check schema compatibility
   */
  @Post('topics/:topicId/schemas/compatibility')
  async checkCompatibility(
    @Param('topicId') topicId: string,
    @Body('schema') schema: Record<string, any>,
  ) {
    return this.schemaRegistryService.checkCompatibility(topicId, schema);
  }

  /**
   * Delete schema version
   */
  @Delete('topics/:topicId/schemas/:version')
  async deleteSchema(
    @Param('topicId') topicId: string,
    @Param('version') version: string,
  ) {
    return this.schemaRegistryService.delete(topicId, parseInt(version));
  }
}
