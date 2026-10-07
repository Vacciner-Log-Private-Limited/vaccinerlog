import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, ConsultationMode, Prisma } from '@prisma/client';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ScheduleAppointmentDto } from './dto/schedule-appointment.dto';
import { DeclineAppointmentDto } from './dto/decline-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** List verified doctors with profiles for patients to browse & book */
  async getApprovedDoctors(search?: string, specialization?: string) {
    const where: Prisma.DoctorProfileWhereInput = {
      status: 'APPROVED',
    };

    if (specialization && specialization.trim()) {
      where.specialization = {
        contains: specialization.trim(),
        mode: 'insensitive',
      };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { specialization: { contains: q, mode: 'insensitive' } },
        { clinicName: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    const profiles = await this.prisma.doctorProfile.findMany({
      where,
      orderBy: { fullName: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            _count: {
              select: {
                publications: true,
              },
            },
          },
        },
      },
    });

    return profiles.map((p) => ({
      id: p.id,
      userId: p.userId,
      email: p.user.email,
      fullName: p.fullName,
      specialization: p.specialization,
      clinicName: p.clinicName,
      city: p.city,
      phone: p.phone,
      registrationNumber: p.registrationNumber,
      publicationCount: p.user._count.publications,
    }));
  }

  /** Patient books an appointment */
  async createAppointment(userId: string, dto: CreateAppointmentDto) {
    // 1. Check patient ownership / access
    const patientAccess = await this.prisma.patientAccess.findUnique({
      where: {
        patientId_userId: {
          patientId: dto.patientId,
          userId,
        },
      },
      include: { patient: true },
    });

    if (!patientAccess) {
      throw new ForbiddenException(
        'You do not have permission to book appointments for this patient profile',
      );
    }

    // 2. Check doctor exists and is approved
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: dto.doctorUserId },
    });

    if (!doctorProfile || doctorProfile.status !== 'APPROVED') {
      throw new BadRequestException('Selected doctor is not available for appointments');
    }

    const preferredDate = new Date(dto.preferredDate);
    if (isNaN(preferredDate.getTime())) {
      throw new BadRequestException('Invalid preferred date');
    }

    return this.prisma.appointment.create({
      data: {
        userId,
        patientId: dto.patientId,
        doctorUserId: dto.doctorUserId,
        mode: dto.mode ?? ConsultationMode.IN_CLINIC,
        preferredDate,
        preferredWindow: dto.preferredWindow?.toUpperCase() ?? 'MORNING',
        reason: dto.reason.trim(),
        status: AppointmentStatus.REQUESTED,
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            relation: true,
            dob: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            doctorProfile: {
              select: {
                fullName: true,
                specialization: true,
                clinicName: true,
                city: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  /** Patient views their appointments */
  async getUserAppointments(userId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { userId },
      orderBy: [
        { scheduledAt: 'asc' },
        { preferredDate: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            relation: true,
            dob: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            doctorProfile: {
              select: {
                fullName: true,
                specialization: true,
                clinicName: true,
                city: true,
                phone: true,
              },
            },
          },
        },
        encounter: {
          select: {
            id: true,
            occurredAt: true,
            recommendation: true,
          },
        },
      },
    });

    return appointments.map((apt) => ({
      id: apt.id,
      patientId: apt.patientId,
      patient: apt.patient,
      doctorUserId: apt.doctorUserId,
      doctor: {
        fullName: apt.doctor.doctorProfile?.fullName ?? 'Doctor',
        specialization: apt.doctor.doctorProfile?.specialization ?? null,
        clinicName: apt.doctor.doctorProfile?.clinicName ?? null,
        city: apt.doctor.doctorProfile?.city ?? null,
        phone: apt.doctor.doctorProfile?.phone ?? null,
      },
      status: apt.status,
      mode: apt.mode,
      preferredDate: apt.preferredDate,
      preferredWindow: apt.preferredWindow,
      reason: apt.reason,
      scheduledAt: apt.scheduledAt,
      durationMinutes: apt.durationMinutes,
      doctorNote: apt.doctorNote,
      declineReason: apt.declineReason,
      encounterId: apt.encounterId,
      createdAt: apt.createdAt,
    }));
  }

  /** Patient cancels appointment */
  async cancelAppointment(userId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own appointments');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel an already completed appointment');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED },
    });
  }

  /** Doctor views their appointment queue */
  async getDoctorAppointments(doctorUserId: string, status?: AppointmentStatus) {
    const where: Prisma.AppointmentWhereInput = {
      doctorUserId,
    };

    if (status) {
      where.status = status;
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: [
        { scheduledAt: 'asc' },
        { preferredDate: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            relation: true,
            dob: true,
            gender: true,
            healthConditions: true,
            hasPriorComplications: true,
            complicationNotes: true,
            hasSurgicalComplications: true,
            surgicalComplicationNotes: true,
            height: true,
            weight: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
        encounter: {
          select: {
            id: true,
            occurredAt: true,
          },
        },
      },
    });

    return appointments.map((apt) => ({
      id: apt.id,
      patientId: apt.patientId,
      patient: apt.patient,
      bookedByEmail: apt.user.email,
      status: apt.status,
      mode: apt.mode,
      preferredDate: apt.preferredDate,
      preferredWindow: apt.preferredWindow,
      reason: apt.reason,
      scheduledAt: apt.scheduledAt,
      durationMinutes: apt.durationMinutes,
      doctorNote: apt.doctorNote,
      declineReason: apt.declineReason,
      encounterId: apt.encounterId,
      createdAt: apt.createdAt,
    }));
  }

  /** Doctor confirms & schedules appointment with exact datetime */
  async scheduleAppointment(
    doctorUserId: string,
    appointmentId: string,
    dto: ScheduleAppointmentDto,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.doctorUserId !== doctorUserId) {
      throw new ForbiddenException('You can only schedule appointments assigned to you');
    }

    if (
      appointment.status !== AppointmentStatus.REQUESTED &&
      appointment.status !== AppointmentStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        `Cannot schedule an appointment with status ${appointment.status}`,
      );
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid scheduled date/time');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt,
        durationMinutes: dto.durationMinutes ?? 30,
        doctorNote: dto.doctorNote?.trim() || null,
        declineReason: null,
      },
    });
  }

  /** Doctor declines appointment request */
  async declineAppointment(
    doctorUserId: string,
    appointmentId: string,
    dto: DeclineAppointmentDto,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.doctorUserId !== doctorUserId) {
      throw new ForbiddenException('You can only decline appointments assigned to you');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot decline an already completed appointment');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.DECLINED,
        declineReason: dto.reason?.trim() || 'Doctor is unavailable at requested time.',
      },
    });
  }

  /** Doctor launches direct 1-click consultation session from confirmed appointment */
  async startVisitFromAppointment(doctorUserId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.doctorUserId !== doctorUserId) {
      throw new ForbiddenException('This appointment is assigned to another doctor');
    }

    // Auto-create live session grant for 90 minutes so the doctor can view records & prescribe
    const codeHash = crypto.randomBytes(32).toString('hex');
    const accessExpiresAt = new Date(Date.now() + 90 * 60 * 1000);

    const grant = await this.prisma.consentGrant.create({
      data: {
        patientId: appointment.patientId,
        codeHash,
        scope: 'VIEW_AND_RECORD',
        status: 'USED',
        expiresAt: accessExpiresAt,
        doctorUserId,
        accessExpiresAt,
        usedAt: new Date(),
      },
    });

    return {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patient.fullName,
      mode: appointment.mode,
      accessExpiresAt: grant.accessExpiresAt,
    };
  }
}
