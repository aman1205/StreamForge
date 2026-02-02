import { IsString, Matches } from 'class-validator';

export class CreateConsumerGroupDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Consumer group name must contain only lowercase letters, numbers, and hyphens',
  })
  name: string;
}
