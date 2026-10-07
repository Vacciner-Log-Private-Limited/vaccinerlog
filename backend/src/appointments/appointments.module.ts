import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DoctorModule } from '../doctor/doctor.module';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { DoctorAppointmentsController } from './doctor-appointments.controller';

@Module({
  imports: [PrismaModule, DoctorModule],
  controllers: [AppointmentsController, DoctorAppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
