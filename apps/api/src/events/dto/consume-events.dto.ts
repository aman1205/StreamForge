import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class ConsumeEventsDto {
  @IsOptional()
  @IsString()
  offset?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  partition?: number;
}
