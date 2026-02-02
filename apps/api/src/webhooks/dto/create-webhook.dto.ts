import {
  IsString,
  IsUrl,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';
import { WebhookStatus } from '@prisma/client';

export class CreateWebhookDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  secret?: string; // For HMAC signature verification

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>; // Content-based filters

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
