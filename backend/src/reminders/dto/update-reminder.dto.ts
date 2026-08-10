import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { ReminderStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateReminderDto } from './create-reminder.dto';

export class UpdateReminderDto extends PartialType(
  OmitType(CreateReminderDto, ['patientId'] as const),
) {
  @ApiPropertyOptional({ enum: ReminderStatus })
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;
}
