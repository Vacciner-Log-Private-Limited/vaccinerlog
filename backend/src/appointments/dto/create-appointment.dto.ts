import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsultationMode } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'The patient ID (self or family member)' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'The doctor user ID' })
  @IsUUID()
  @IsNotEmpty()
  doctorUserId: string;

  @ApiPropertyOptional({
    enum: ConsultationMode,
    default: ConsultationMode.IN_CLINIC,
  })
  @IsOptional()
  @IsEnum(ConsultationMode)
  mode?: ConsultationMode;

  @ApiProperty({ example: '2026-10-15', description: 'Preferred appointment date' })
  @IsDateString()
  @IsNotEmpty()
  preferredDate: string;

  @ApiPropertyOptional({
    example: 'MORNING',
    description: 'Preferred window: MORNING, AFTERNOON, or EVENING',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  preferredWindow?: string;

  @ApiProperty({
    example: 'Follow-up for infant immunization and mild rash post vaccine',
    description: 'Reason for visit or symptoms',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason: string;
}
