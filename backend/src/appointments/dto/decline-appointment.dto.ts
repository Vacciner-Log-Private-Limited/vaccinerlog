import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeclineAppointmentDto {
  @ApiPropertyOptional({
    example: 'Doctor is on scheduled leave during this time. Please book for tomorrow.',
    description: 'Reason for declining appointment',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
