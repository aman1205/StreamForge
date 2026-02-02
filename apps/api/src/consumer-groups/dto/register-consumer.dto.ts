import { IsString } from 'class-validator';

export class RegisterConsumerDto {
  @IsString()
  consumerId: string;
}
