import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Permission } from '@prisma/client';

export class GrantAclDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  apiKeyId?: string;

  @IsEnum(Permission)
  permission: Permission;
}
