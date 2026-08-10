import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateRecordDto } from './create-record.dto';

// patientId cannot be changed after creation (would move the record to a
// different person), so it is omitted from the update payload.
export class UpdateRecordDto extends PartialType(
  OmitType(CreateRecordDto, ['patientId'] as const),
) {}
