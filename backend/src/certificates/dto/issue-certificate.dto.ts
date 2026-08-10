import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class IssueCertificateDto {
  @ApiProperty({ format: 'uuid', description: 'The vaccination record to certify' })
  @IsUUID()
  recordId: string;
}
