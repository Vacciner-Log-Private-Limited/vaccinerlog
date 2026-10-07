import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDoctorDto {
  @ApiProperty({ example: 'dr.rao@clinic.in' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongpass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Dr. Suresh Rao' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: 'TSMC-2015-44718', description: 'Medical council registration number' })
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  registrationNumber: string;

  @ApiPropertyOptional({ example: 'General Physician' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialization?: string;

  @ApiPropertyOptional({ example: 'Apollo Clinic' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  clinicName?: string;

  @ApiPropertyOptional({ example: 'Hyderabad' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
