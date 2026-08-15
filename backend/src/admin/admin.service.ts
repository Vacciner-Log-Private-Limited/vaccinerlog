import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProviderDto,
  UpdateProviderDto,
  UpdateVaccineDto,
  VaccineDto,
} from './dto/catalog.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** High-level platform metrics for the admin overview page. */
  async getStats() {
    const [
      users,
      patients,
      records,
      certificates,
      providers,
      vaccines,
      remindersPending,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.patient.count(),
      this.prisma.vaccinationRecord.count(),
      this.prisma.certificate.count(),
      this.prisma.provider.count(),
      this.prisma.vaccine.count(),
      this.prisma.reminder.count({
        where: { status: { in: ['PENDING', 'SENT'] } },
      }),
    ]);

    // Records per vaccine (most administered first)
    const grouped = await this.prisma.vaccinationRecord.groupBy({
      by: ['vaccineId'],
      _count: { _all: true },
    });
    const vaccineList = await this.prisma.vaccine.findMany({
      select: { id: true, name: true },
    });
    const nameById = new Map(vaccineList.map((v) => [v.id, v.name]));
    const vaccineDistribution = grouped
      .map((g) => ({
        name: nameById.get(g.vaccineId) ?? 'Unknown',
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    // Records administered per month, last 6 months
    const rawByMonth = await this.prisma.$queryRaw<
      Array<{ month: string; count: number }>
    >`
      SELECT to_char(date_trunc('month', "dateAdministered"), 'Mon YYYY') AS month,
             count(*)::int AS count
      FROM vaccination_records
      WHERE "dateAdministered" >= now() - interval '6 months'
      GROUP BY date_trunc('month', "dateAdministered")
      ORDER BY date_trunc('month', "dateAdministered")`;

    const recentUsers = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, role: true, createdAt: true },
    });

    const recentRecords = await this.prisma.vaccinationRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        vaccine: { select: { name: true } },
        patient: { select: { fullName: true } },
      },
    });

    return {
      totals: {
        users,
        patients,
        records,
        certificates,
        providers,
        vaccines,
        remindersPending,
      },
      vaccineDistribution,
      recordsByMonth: rawByMonth.map((r) => ({
        month: r.month,
        count: Number(r.count),
      })),
      recentUsers,
      recentRecords: recentRecords.map((r) => ({
        id: r.id,
        vaccine: r.vaccine.name,
        person: r.patient.fullName,
        date: r.dateAdministered,
      })),
    };
  }

  /** All accounts with a few useful counts, for the user-management page. */
  async getUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { patients: true } },
      },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      patients: u._count.patients,
    }));
  }

  setUserRole(id: string, role: Role) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });
  }

  /** Full drill-down of one account: family members + their records & reminders. */
  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        patients: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            fullName: true,
            relation: true,
            dob: true,
            gender: true,
            nationality: true,
            idProofType: true,
            idProofNumber: true,
            healthId: true,
            records: {
              orderBy: { dateAdministered: 'desc' },
              select: {
                id: true,
                doseNumber: true,
                dateAdministered: true,
                verified: true,
                symptoms: true,
                batchNumber: true,
                vaccine: { select: { name: true, totalDoses: true } },
                provider: { select: { name: true } },
                certificate: { select: { id: true, verificationCode: true } },
              },
            },
            reminders: {
              orderBy: { dueDate: 'asc' },
              select: {
                id: true,
                doseNumber: true,
                dueDate: true,
                status: true,
                vaccine: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const records = user.patients.reduce((n, p) => n + p.records.length, 0);
    const certificates = user.patients.reduce(
      (n, p) => n + p.records.filter((r) => r.certificate).length,
      0,
    );
    const reminders = user.patients.reduce((n, p) => n + p.reminders.length, 0);
    return {
      ...user,
      counts: { patients: user.patients.length, records, certificates, reminders },
    };
  }

  async deleteUser(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  async deletePatient(id: string) {
    await this.prisma.patient.delete({ where: { id } });
    return { deleted: true };
  }

  // ---- Vaccine catalog -----------------------------------------------------

  async listVaccines() {
    const vs = await this.prisma.vaccine.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        totalDoses: true,
        _count: { select: { records: true } },
      },
    });
    return vs.map((v) => ({
      id: v.id,
      name: v.name,
      description: v.description,
      totalDoses: v.totalDoses,
      records: v._count.records,
    }));
  }

  createVaccine(dto: VaccineDto) {
    return this.prisma.vaccine.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        totalDoses: dto.totalDoses ?? 1,
      },
    });
  }

  updateVaccine(id: string, dto: UpdateVaccineDto) {
    return this.prisma.vaccine.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        totalDoses: dto.totalDoses,
      },
    });
  }

  async deleteVaccine(id: string) {
    const count = await this.prisma.vaccinationRecord.count({
      where: { vaccineId: id },
    });
    if (count > 0) {
      throw new BadRequestException(
        `Can't delete this vaccine — it's used by ${count} record(s).`,
      );
    }
    await this.prisma.vaccine.delete({ where: { id } });
    return { deleted: true };
  }

  // ---- Providers -----------------------------------------------------------

  async listProviders() {
    const ps = await this.prisma.provider.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        city: true,
        registrationNumber: true,
        _count: { select: { records: true } },
      },
    });
    return ps.map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      registrationNumber: p.registrationNumber,
      records: p._count.records,
    }));
  }

  createProvider(dto: ProviderDto) {
    return this.prisma.provider.create({
      data: {
        name: dto.name,
        city: dto.city ?? null,
        registrationNumber: dto.registrationNumber ?? null,
      },
    });
  }

  updateProvider(id: string, dto: UpdateProviderDto) {
    return this.prisma.provider.update({
      where: { id },
      data: {
        name: dto.name,
        city: dto.city,
        registrationNumber: dto.registrationNumber,
      },
    });
  }

  async deleteProvider(id: string) {
    // detach from records first (provider is optional on a record)
    await this.prisma.vaccinationRecord.updateMany({
      where: { providerId: id },
      data: { providerId: null },
    });
    await this.prisma.provider.delete({ where: { id } });
    return { deleted: true };
  }

  // ---- Certificates oversight (read-only) ----------------------------------

  async listCertificates() {
    const cs = await this.prisma.certificate.findMany({
      orderBy: { issuedAt: 'desc' },
      select: {
        id: true,
        verificationCode: true,
        issuedAt: true,
        record: {
          select: {
            doseNumber: true,
            vaccine: { select: { name: true } },
            patient: {
              select: { fullName: true, owner: { select: { email: true } } },
            },
          },
        },
      },
    });
    return cs.map((c) => ({
      id: c.id,
      verificationCode: c.verificationCode,
      issuedAt: c.issuedAt,
      doseNumber: c.record.doseNumber,
      vaccine: c.record.vaccine.name,
      person: c.record.patient.fullName,
      owner: c.record.patient.owner.email,
    }));
  }

  // ---- Reminders oversight (read-only) -------------------------------------

  async listReminders() {
    const rs = await this.prisma.reminder.findMany({
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        doseNumber: true,
        dueDate: true,
        status: true,
        vaccine: { select: { name: true } },
        patient: {
          select: { fullName: true, owner: { select: { email: true } } },
        },
      },
    });
    return rs.map((r) => ({
      id: r.id,
      doseNumber: r.doseNumber,
      dueDate: r.dueDate,
      status: r.status,
      vaccine: r.vaccine.name,
      person: r.patient.fullName,
      owner: r.patient.owner.email,
    }));
  }
}
