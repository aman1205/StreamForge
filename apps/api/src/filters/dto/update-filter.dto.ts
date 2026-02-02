import { IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { FilterOperator } from '@prisma/client';

export class UpdateFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsEnum(FilterOperator)
  operator?: FilterOperator;

  @IsOptional()
  value?: any;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
