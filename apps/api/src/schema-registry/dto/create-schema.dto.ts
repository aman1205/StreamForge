import { IsObject, IsOptional, IsString, IsEnum } from 'class-validator';
import { SchemaFormat } from '@prisma/client';

export class CreateSchemaDto {
  @IsObject()
  schema: Record<string, any>; // JSON Schema definition

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SchemaFormat)
  format?: SchemaFormat;
}
