import { Module } from '@nestjs/common';
import { SchemaRegistryController } from './schema-registry.controller';
import { SchemaRegistryService } from './schema-registry.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [SchemaRegistryController],
  providers: [SchemaRegistryService, PrismaService],
  exports: [SchemaRegistryService],
})
export class SchemaRegistryModule {}
