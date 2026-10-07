import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class DownloadBundleDto {
  @ApiProperty({
    type: [String],
    description: 'IDs of the certificates to combine into one PDF',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];
}
