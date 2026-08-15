import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class SetRoleDto {
  @ApiProperty({ enum: Role, example: 'PROVIDER' })
  @IsEnum(Role)
  role: Role;
}
