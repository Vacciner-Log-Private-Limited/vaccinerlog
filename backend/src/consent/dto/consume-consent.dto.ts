import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ConsumeConsentDto {
  @ApiProperty({ example: 'Ab3xK9pQ' })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  code: string;
}
