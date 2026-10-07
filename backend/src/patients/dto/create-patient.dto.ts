import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, IdProofType, Relation } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({ example: 'Baby Kumar' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiPropertyOptional({ enum: Relation, example: 'CHILD' })
  @IsOptional()
  @IsEnum(Relation)
  relation?: Relation;

  @ApiPropertyOptional({ example: '2020-05-14', description: 'ISO date (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  dob?: string;

  @ApiPropertyOptional({ enum: Gender, example: 'MALE' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '12-3456-7890-1234', description: 'ABHA / Health ID' })
  @IsOptional()
  @IsString()
  healthId?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Indian' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ enum: IdProofType, example: 'AADHAAR' })
  @IsOptional()
  @IsEnum(IdProofType)
  idProofType?: IdProofType;

  @ApiPropertyOptional({ example: 'XXXX-XXXX-1234', description: 'The ID document number' })
  @IsOptional()
  @IsString()
  idProofNumber?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Diabetes', 'Asthma / respiratory illness'],
    description: 'Chronic health conditions the person has',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(100, { each: true })
  healthConditions?: string[];

  @ApiPropertyOptional({ example: true, description: 'Any past clinical complications?' })
  @IsOptional()
  @IsBoolean()
  hasPriorComplications?: boolean;

  @ApiPropertyOptional({ example: 'Fever and rash after a previous tetanus shot in 2019.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  complicationNotes?: string;

  @ApiPropertyOptional({ example: true, description: 'Any past surgical complications?' })
  @IsOptional()
  @IsBoolean()
  hasSurgicalComplications?: boolean;

  @ApiPropertyOptional({ example: 'Excess bleeding during an appendectomy in 2021.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  surgicalComplicationNotes?: string;

  @ApiPropertyOptional({ example: 175.5, description: 'Height in cm' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  height?: number;

  @ApiPropertyOptional({ example: 68.0, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number;
}
