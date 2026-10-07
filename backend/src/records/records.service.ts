import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { CertificatesService } from '../certificates/certificates.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';

@Injectable()
export class RecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly certificates: CertificatesService,
  ) {}

  async create(userId: string, dto: CreateRecordDto) {
    await this.access.assertAccess(userId, dto.patientId);
    const record = await this.prisma.vaccinationRecord.create({
      data: {
        patientId: dto.patientId,
        vaccineId: dto.vaccineId,
        providerId: dto.providerId ?? null,
        doseNumber: dto.doseNumber ?? 1,
        dateAdministered: new Date(dto.dateAdministered),
        batchNumber: dto.batchNumber ?? null,
        symptoms: dto.symptoms ?? null,
        status: dto.status ?? 'COMPLETED',
      },
      include: { vaccine: true, provider: true },
    });
    // Every vaccination record automatically gets a verifiable certificate,
    // so it shows up on the Certificates page.
    await this.certificates.issue(userId, record.id);
    record.verified = true; // issue() marks the record verified
    return record;
  }

  /** All records across the user's patients, optionally filtered to one patient. */
  async findAllForUser(userId: string, patientId?: string) {
    if (patientId) {
      await this.access.assertAccess(userId, patientId);
    }
    return this.prisma.vaccinationRecord.findMany({
      where: {
        patient: this.access.patientWhere(userId),
        ...(patientId ? { patientId } : {}),
      },
      include: {
        vaccine: true,
        provider: true,
        patient: { select: { id: true, fullName: true, relation: true, dob: true } },
        certificate: { select: { id: true, verificationCode: true } },
      },
      orderBy: { dateAdministered: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
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
    await this.access.assertAccess(userId, record.patientId);
    return record;
  }

  async update(userId: string, id: string, dto: UpdateRecordDto) {
    await this.findOne(userId, id); // access check
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
        symptoms: dto.symptoms,
        status: dto.status,
      },
      include: { vaccine: true, provider: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // access check
    await this.prisma.vaccinationRecord.delete({ where: { id } });
    return { deleted: true };
  }

  /** Dashboard summary counts across all the user's patients. */
  async summary(userId: string) {
    const scope = this.access.patientWhere(userId);
    const [totalVaccines, nextDue, certificates] = await Promise.all([
      this.prisma.vaccinationRecord.count({
        where: { patient: scope, status: 'COMPLETED' },
      }),
      this.prisma.reminder.count({
        where: { patient: scope, status: { in: ['PENDING', 'SENT'] } },
      }),
      this.prisma.certificate.count({
        where: { record: { patient: scope } },
      }),
    ]);
    return { totalVaccines, nextDue, certificates };
  }
}
