import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { ApprovedDoctorGuard } from '../doctor/approved-doctor.guard';
import { AppointmentsService } from './appointments.service';
import { ScheduleAppointmentDto } from './dto/schedule-appointment.dto';
import { DeclineAppointmentDto } from './dto/decline-appointment.dto';

@ApiTags('doctor')
@Controller('doctor/appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ApprovedDoctorGuard)
export class DoctorAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /** Doctor views their appointments queue */
  @Get()
  getDoctorAppointments(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentsService.getDoctorAppointments(user.id, status);
  }

  /** Doctor confirms and schedules appointment */
  @Patch(':id/schedule')
  scheduleAppointment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ScheduleAppointmentDto,
  ) {
    return this.appointmentsService.scheduleAppointment(user.id, id, dto);
  }

  /** Doctor declines appointment */
  @Patch(':id/decline')
  declineAppointment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: DeclineAppointmentDto,
  ) {
    return this.appointmentsService.declineAppointment(user.id, id, dto);
  }

  /** Doctor launches direct consultation session from appointment */
  @Post(':id/start-visit')
  startVisit(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.appointmentsService.startVisitFromAppointment(user.id, id);
  }
}
