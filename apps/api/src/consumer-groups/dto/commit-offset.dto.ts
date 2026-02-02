import { IsNumber, IsString, Min } from 'class-validator';

export class CommitOffsetDto {
  @IsNumber()
  @Min(0)
  partition: number;

  @IsString()
  offset: string;
}
