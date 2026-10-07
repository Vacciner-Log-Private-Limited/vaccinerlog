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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /** Public/authenticated directory of verified doctors */
  @Get('doctors')
  getApprovedDoctors(
    @Query('search') search?: string,
    @Query('specialization') specialization?: string,
  ) {
    return this.appointmentsService.getApprovedDoctors(search, specialization);
  }

  /** Patient books an appointment */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  createAppointment(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.createAppointment(user.id, dto);
  }

  /** Patient views their appointments */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getUserAppointments(@CurrentUser() user: AuthUser) {
    return this.appointmentsService.getUserAppointments(user.id);
  }

  /** Patient cancels an appointment */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancelAppointment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.appointmentsService.cancelAppointment(user.id, id);
  }
}
