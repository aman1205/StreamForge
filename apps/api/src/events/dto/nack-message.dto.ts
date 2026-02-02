import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class NackMessageDto {
  @IsString()
  consumerId: string;

  @IsString()
  offset: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  requeue?: boolean;
}
