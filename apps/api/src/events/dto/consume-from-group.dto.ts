import { IsString, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';

export class ConsumeFromGroupDto {
  @IsString()
  consumerId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  partition?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;

  @IsOptional()
  @IsBoolean()
  autoCommit?: boolean;
}
