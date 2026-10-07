import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ScheduleAppointmentDto {
  @ApiProperty({
    example: '2026-10-15T10:30:00.000Z',
    description: 'Confirmed appointment datetime',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Estimated duration in minutes',
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(180)
  durationMinutes?: number;

  @ApiPropertyOptional({
    example: 'Room 204, Pediatrics Wing. Fasting not required.',
    description: 'Clinic room, instructions, or teleconsult link',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  doctorNote?: string;
}
