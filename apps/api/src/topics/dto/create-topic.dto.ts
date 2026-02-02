import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Matches,
  IsObject,
} from 'class-validator';

export class CreateTopicDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Topic name must contain only lowercase letters, numbers, and hyphens',
  })
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  partitions?: number;

  @IsOptional()
  @IsNumber()
  @Min(3600000) // 1 hour minimum
  retentionMs?: number;

  @IsOptional()
  @IsObject()
  schema?: Record<string, any>;
}
