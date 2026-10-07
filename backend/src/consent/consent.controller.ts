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
import { ConsentScope } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { ConsentService } from './consent.service';
import { GenerateConsentDto } from './dto/generate-consent.dto';

@ApiTags('consent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('consent')
export class ConsentController {
  constructor(private readonly consent: ConsentService) {}

  /** Patient/guardian: mint a one-time code to share with a doctor. */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('generate')
  generate(@CurrentUser() user: AuthUser, @Body() dto: GenerateConsentDto) {
    return this.consent.generate(user.id, dto.patientId, dto.scope ?? ConsentScope.VIEW);
  }

  /** List codes/sessions currently live for the caller's profiles. */
  @Get()
  listActive(@CurrentUser() user: AuthUser) {
    return this.consent.listActive(user.id);
  }

  /** Revoke a code / end a live session. */
  @Delete(':id')
  revoke(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.consent.revoke(user.id, id);
  }
}
