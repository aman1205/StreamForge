import { IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { FilterOperator } from '@prisma/client';

export class CreateFilterDto {
  @IsString()
  name: string;

  @IsString()
  field: string; // JSON path (e.g., "payload.userId", "metadata.source")

  @IsEnum(FilterOperator)
  operator: FilterOperator;

  value: any; // Value to compare against (any type)

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
