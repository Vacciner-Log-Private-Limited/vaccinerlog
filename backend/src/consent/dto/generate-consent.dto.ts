import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsentScope } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class GenerateConsentDto {
  @ApiProperty({ description: 'Which profile to share (self or a family member)' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ enum: ConsentScope, default: 'VIEW' })
  @IsOptional()
  @IsEnum(ConsentScope)
  scope?: ConsentScope;
}
