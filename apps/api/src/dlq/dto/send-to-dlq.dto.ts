import { IsString, IsNumber, IsObject, IsOptional, IsEnum, Min } from 'class-validator';
import { FailureReason } from '@prisma/client';

export class SendToDlqDto {
  @IsString()
  topicId: string;

  @IsOptional()
  @IsString()
  consumerGroupId?: string;

  @IsNumber()
  @Min(0)
  partition: number;

  @IsString()
  originalOffset: string;

  @IsObject()
  payload: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsString()
  errorMessage: string;

  @IsOptional()
  @IsString()
  errorStack?: string;

  @IsOptional()
  @IsEnum(FailureReason)
  failureReason?: FailureReason;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRetries?: number;
}
