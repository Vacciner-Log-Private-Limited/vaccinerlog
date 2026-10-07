import { IsString, MaxLength, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  @MinLength(20, { message: 'That does not look like a valid claim code.' })
  @MaxLength(200)
  code!: string;
}
