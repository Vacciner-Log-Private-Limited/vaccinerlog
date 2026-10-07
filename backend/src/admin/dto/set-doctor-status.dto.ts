import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class SetDoctorStatusDto {
  @ApiProperty({ enum: VerificationStatus, example: 'APPROVED' })
  @IsEnum(VerificationStatus)
  status: VerificationStatus;
}
