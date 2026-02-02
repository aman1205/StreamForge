import {
  IsString,
  IsUrl,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';
import { WebhookStatus } from '@prisma/client';

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsObject()
  retryPolicy?: {
    maxRetries?: number;
    backoffMs?: number;
  };

  @IsOptional()
  @IsEnum(WebhookStatus)
  status?: WebhookStatus;
}
