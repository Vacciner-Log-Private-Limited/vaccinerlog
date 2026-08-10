import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';

@Injectable()
export class RecordsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Verify the current user owns the given patient. */
  private async assertOwnsPatient(ownerId: string, patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    if (patient.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have access to this patient');
    }
    return patient;
  }

  async create(ownerId: string, dto: CreateRecordDto) {
    await this.assertOwnsPatient(ownerId, dto.patientId);
    return this.prisma.vaccinationRecord.create({
      data: {
        patientId: dto.patientId,
        vaccineId: dto.vaccineId,
        providerId: dto.providerId ?? null,
        doseNumber: dto.doseNumber ?? 1,
        dateAdministered: new Date(dto.dateAdministered),
        batchNumber: dto.batchNumber ?? null,
        status: dto.status ?? 'COMPLETED',
      },
      include: { vaccine: true, provider: true },
    });
  }

  /** All records across the user's patients, optionally filtered to one patient. */
  async findAllForUser(ownerId: string, patientId?: string) {
    if (patientId) {
      await this.assertOwnsPatient(ownerId, patientId);
    }
    return this.prisma.vaccinationRecord.findMany({
      where: {
        patient: { ownerId },
        ...(patientId ? { patientId } : {}),
      },
      include: {
        vaccine: true,
        provider: true,
        patient: { select: { id: true, fullName: true, relation: true } },
        certificate: { select: { id: true, verificationCode: true } },
      },
      orderBy: { dateAdministered: 'desc' },
    });
  }

  async findOne(ownerId: string, id: string) {
    const record = await this.prisma.vaccinationRecord.findUnique({
      where: { id },
      include: {
        vaccine: true,
        provider: true,
        patient: true,
        certificate: true,
      },
    });
    if (!record) {
      throw new NotFoundException('Record not found');
    }
    if (record.patient.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have access to this record');
    }
    return record;
  }

  async update(ownerId: string, id: string, dto: UpdateRecordDto) {
    await this.findOne(ownerId, id); // ownership check
    return this.prisma.vaccinationRecord.update({
      where: { id },
      data: {
        vaccineId: dto.vaccineId,
        providerId: dto.providerId,
        doseNumber: dto.doseNumber,
        dateAdministered: dto.dateAdministered
          ? new Date(dto.dateAdministered)
          : undefined,
        batchNumber: dto.batchNumber,
        status: dto.status,
      },
      include: { vaccine: true, provider: true },
    });
  }

  async remove(ownerId: string, id: string) {
    await this.findOne(ownerId, id); // ownership check
    await this.prisma.vaccinationRecord.delete({ where: { id } });
    return { deleted: true };
  }

  /** Dashboard summary counts across all the user's patients. */
  async summary(ownerId: string) {
    const [totalVaccines, nextDue, certificates] = await Promise.all([
      this.prisma.vaccinationRecord.count({
        where: { patient: { ownerId }, status: 'COMPLETED' },
      }),
      this.prisma.reminder.count({
        where: { patient: { ownerId }, status: { in: ['PENDING', 'SENT'] } },
      }),
      this.prisma.certificate.count({
        where: { record: { patient: { ownerId } } },
      }),
    ]);
    return { totalVaccines, nextDue, certificates };
  }
}
