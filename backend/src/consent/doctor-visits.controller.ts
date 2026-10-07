import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApprovedDoctorGuard } from '../doctor/approved-doctor.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { ConsentService } from './consent.service';
import { ConsumeConsentDto } from './dto/consume-consent.dto';
import { SaveNoteDto } from './dto/save-note.dto';

@ApiTags('doctor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ApprovedDoctorGuard)
@Controller('doctor/visits')
export class DoctorVisitsController {
  constructor(private readonly consent: ConsentService) {}

  /** Doctor redeems a patient's code to start a visit. */
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('consume')
  consume(@CurrentUser() user: AuthUser, @Body() dto: ConsumeConsentDto) {
    return this.consent.consume(user.id, dto.code);
  }

  /** Doctor views the patient's records during a live session (consent-gated). */
  @Get(':patientId/records')
  records(@CurrentUser() user: AuthUser, @Param('patientId') patientId: string) {
    return this.consent.getPatientRecords(user.id, patientId);
  }

  /** Doctor saves the consultation note + prescription for the current visit. */
  @Put(':patientId/note')
  saveNote(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Body() dto: SaveNoteDto,
  ) {
    return this.consent.saveNote(user.id, patientId, dto);
  }
}
