import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecordStatus } from '@prisma/client';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateRecordDto {
  @ApiProperty({ format: 'uuid', description: 'Which patient this dose is for' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vaccineId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  doseNumber?: number;

  @ApiProperty({ example: '2025-10-20', description: 'ISO date (YYYY-MM-DD)' })
  @IsISO8601()
  dateAdministered: string;

  @ApiPropertyOptional({ example: 'LOT-12345' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ example: 'Mild fever and soreness at the injection site' })
  @IsOptional()
  @IsString()
  symptoms?: string;

  @ApiPropertyOptional({ enum: RecordStatus, default: 'COMPLETED' })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}
