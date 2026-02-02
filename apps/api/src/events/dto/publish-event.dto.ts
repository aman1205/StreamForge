import { IsObject, IsOptional, IsNumber, Min } from 'class-validator';

export class PublishEventDto {
  @IsObject()
  payload: Record<string, any>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  partition?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000) // Minimum 1 second
  ttlMs?: number; // Time to live in milliseconds
}
