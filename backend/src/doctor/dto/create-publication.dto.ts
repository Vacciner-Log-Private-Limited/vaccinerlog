import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicationType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePublicationDto {
  @ApiProperty({ example: 'Efficacy of Bivalent mRNA Booster in Pediatric Cohorts' })
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  title: string;

  @ApiProperty({
    enum: PublicationType,
    example: PublicationType.RESEARCH_PAPER,
  })
  @IsEnum(PublicationType)
  type: PublicationType;

  @ApiProperty({
    example:
      'A prospective multi-center observational study evaluating antibody persistence and safety profiles in 1,200 subjects over a 12-month follow-up period.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  summary: string;

  @ApiPropertyOptional({ example: 'Pediatrics / Immunology' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialization?: string;

  @ApiPropertyOptional({
    example: ['Pediatrics', 'mRNA', 'Vaccines'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Indian Journal of Pediatrics / AIIMS' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  journalOrIssuer?: string;

  @ApiPropertyOptional({
    example: 'https://doi.org/10.1016/j.vaccine.2024.01.002',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  publicationUrl?: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  year?: number;
}
