import { IsString, IsArray, ArrayMinSize } from 'class-validator';

export class AcknowledgeMessageDto {
  @IsString()
  consumerId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  offsets: string[];
}
