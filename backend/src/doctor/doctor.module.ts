import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { DoctorAccessService } from './doctor-access.service';
import { ApprovedDoctorGuard } from './approved-doctor.guard';

@Module({
  imports: [AuthModule], // for JwtModule (issuing the doctor's token)
  controllers: [DoctorController],
  providers: [DoctorService, DoctorAccessService, ApprovedDoctorGuard],
  exports: [DoctorAccessService, ApprovedDoctorGuard],
})
export class DoctorModule {}
