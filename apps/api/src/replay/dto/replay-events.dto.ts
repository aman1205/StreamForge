import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, Min } from 'class-validator';

export enum ReplayMode {
  FROM_OFFSET = 'FROM_OFFSET',
  FROM_TIMESTAMP = 'FROM_TIMESTAMP',
  TIME_RANGE = 'TIME_RANGE',
  OFFSET_RANGE = 'OFFSET_RANGE',
}

export class ReplayEventsDto {
  @IsEnum(ReplayMode)
  mode: ReplayMode;

  @IsOptional()
  @IsString()
  fromOffset?: string; // Redis Stream message ID

  @IsOptional()
  @IsString()
  toOffset?: string;

  @IsOptional()
  @IsDateString()
  fromTimestamp?: string;

  @IsOptional()
  @IsDateString()
  toTimestamp?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  batchSize?: number; // Events per batch (default: 100)

  @IsOptional()
  @IsNumber()
  @Min(1)
  speed?: number; // Replay speed multiplier (1 = real-time, 2 = 2x speed, etc.)

  @IsOptional()
  @IsString()
  destinationTopic?: string; // Republish to different topic
}
