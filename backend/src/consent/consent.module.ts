import { Module } from '@nestjs/common';
import { DoctorModule } from '../doctor/doctor.module';
import { ConsentService } from './consent.service';
import { ConsentController } from './consent.controller';
import { DoctorVisitsController } from './doctor-visits.controller';

@Module({
  imports: [DoctorModule], // for ApprovedDoctorGuard (and DoctorAccessService later)
  controllers: [ConsentController, DoctorVisitsController],
  providers: [ConsentService],
  exports: [ConsentService],
})
export class ConsentModule {}
