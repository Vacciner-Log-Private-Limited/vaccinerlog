import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AccessModule } from './access/access.module';
import { DoctorModule } from './doctor/doctor.module';
import { ConsentModule } from './consent/consent.module';
import { PatientsModule } from './patients/patients.module';
import { VaccinesModule } from './vaccines/vaccines.module';
import { ProvidersModule } from './providers/providers.module';
import { RecordsModule } from './records/records.module';
import { CertificatesModule } from './certificates/certificates.module';
import { RemindersModule } from './reminders/reminders.module';
import { AdminModule } from './admin/admin.module';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Sane default rate limit for every route (per IP); tighter limits are set
    // per-route with @Throttle on the sensitive invite/claim endpoints.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    AccessModule,
    DoctorModule,
    ConsentModule,
    PatientsModule,
    VaccinesModule,
    ProvidersModule,
    RecordsModule,
    CertificatesModule,
    RemindersModule,
    AdminModule,
    AppointmentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
