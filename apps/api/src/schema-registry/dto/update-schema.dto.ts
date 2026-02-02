import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSchemaDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
