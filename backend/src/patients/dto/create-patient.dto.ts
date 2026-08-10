import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, IdProofType, Relation } from '@prisma/client';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
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
}
