import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { DelegationService } from './delegation.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';

@ApiTags('access')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AccessController {
  constructor(private readonly delegation: DelegationService) {}

  /** Guardian: mint a one-time claim code for an adult member. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('patients/:id/access/invite')
  createInvite(
    @CurrentUser() user: AuthUser,
    @Param('id') patientId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.delegation.createInvite(user.id, patientId, dto.email);
  }

  /** Guardian: list every account that can reach this profile. */
  @Get('patients/:id/access')
  listAccess(@CurrentUser() user: AuthUser, @Param('id') patientId: string) {
    return this.delegation.listAccess(user.id, patientId);
  }

  /** Remove an account's access (cannot remove the last one). */
  @Delete('patients/:id/access/:userId')
  revoke(
    @CurrentUser() user: AuthUser,
    @Param('id') patientId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.delegation.revoke(user.id, patientId, targetUserId);
  }

  /** Invited person: redeem a claim code to gain access to their profile. */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('access/accept')
  accept(@CurrentUser() user: AuthUser, @Body() dto: AcceptInviteDto) {
    return this.delegation.acceptInvite(user.id, user.email, dto.code);
  }
}
