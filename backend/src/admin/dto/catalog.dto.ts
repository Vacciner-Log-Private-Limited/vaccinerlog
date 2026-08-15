import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class VaccineDto {
  @ApiProperty({ example: 'Hepatitis B' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Protects against the hepatitis B virus' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 3, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalDoses?: number;
}

export class UpdateVaccineDto extends PartialType(VaccineDto) {}

export class ProviderDto {
  @ApiProperty({ example: 'Apollo Hospital' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Hyderabad' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'REG-12345' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;
}

export class UpdateProviderDto extends PartialType(ProviderDto) {}
