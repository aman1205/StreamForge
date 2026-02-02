import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class RetryDlqMessageDto {
  @IsOptional()
  @IsString()
  destinationTopic?: string;

  @IsOptional()
  @IsBoolean()
  resetOffset?: boolean;
}
