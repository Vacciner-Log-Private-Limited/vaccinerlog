import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PrescriptionItemDto {
  @ApiPropertyOptional({ example: 'Paracetamol 500mg' })
  @IsString()
  @MaxLength(160)
  medicine: string;

  @ApiPropertyOptional({ example: '500 mg' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  dosage?: string;

  @ApiPropertyOptional({ example: 'twice daily' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  frequency?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  durationDays?: number;
}

export class SaveNoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  problem?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(60, { each: true })
  problemTags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  recommendation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prescriptionText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sharedWithPatient?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiPropertyOptional({ type: [PrescriptionItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  prescriptions?: PrescriptionItemDto[];
}
