import { IsEmail } from 'class-validator';

export class CreateInviteDto {
  @IsEmail({}, { message: 'A valid email is required.' })
  email!: string;
}
