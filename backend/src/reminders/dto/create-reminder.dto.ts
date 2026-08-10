import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateReminderDto {
  @ApiProperty({ format: 'uuid', description: 'Who the reminder is for' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vaccineId: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  doseNumber?: number;

  @ApiProperty({ example: '2025-11-15', description: 'ISO date the dose is due' })
  @IsISO8601()
  dueDate: string;
}
