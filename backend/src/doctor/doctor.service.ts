import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, PublicationType, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CreatePublicationDto } from './dto/create-publication.dto';

@Injectable()
export class DoctorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Register a doctor: creates the account (role PROVIDER) + a PENDING profile. */
  async register(dto: RegisterDoctorDto) {
    const email = dto.email.trim().toLowerCase();
    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('An account with this email already exists');
    }
    const existingReg = await this.prisma.doctorProfile.findUnique({
      where: { registrationNumber: dto.registrationNumber },
    });
    if (existingReg) {
      throw new ConflictException(
        'A doctor with this registration number already exists',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email, passwordHash, role: Role.PROVIDER },
      });
      await tx.doctorProfile.create({
        data: {
          userId: u.id,
          fullName: dto.fullName,
          registrationNumber: dto.registrationNumber,
          specialization: dto.specialization ?? null,
          clinicName: dto.clinicName ?? null,
          city: dto.city ?? null,
          phone: dto.phone ?? null,
        },
      });
      return u;
    });

    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { accessToken, user: { id: user.id, email: user.email, role: user.role } };
  }

  /** The caller's own doctor profile + verification status. */
  async getMe(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
    const { user, ...rest } = profile;
    return { ...rest, email: user.email };
  }

  /** The doctor's visit history (their own encounters), newest first. */
  async getHistory(doctorUserId: string) {
    const encounters = await this.prisma.encounter.findMany({
      where: { doctorUserId },
      orderBy: { occurredAt: 'desc' },
      include: { _count: { select: { prescriptions: true } } },
    });
    return encounters.map((e) => ({
      id: e.id,
      patientId: e.patientId,
      patientName: e.patientName,
      occurredAt: e.occurredAt,
      problem: e.problem,
      problemTags: e.problemTags,
      recommendation: e.recommendation,
      sharedWithPatient: e.sharedWithPatient,
      prescriptionCount: e._count.prescriptions,
    }));
  }

  /** Practice analytics aggregated over the doctor's own encounters. */
  async getAnalytics(doctorUserId: string) {
    const encounters = await this.prisma.encounter.findMany({
      where: { doctorUserId },
      select: {
        patientId: true,
        occurredAt: true,
        problemTags: true,
        sharedWithPatient: true,
        prescriptions: { select: { medicine: true } },
      },
    });

    const uniquePatients = new Set(encounters.map((e) => e.patientId)).size;
    let totalPrescriptions = 0;
    let shared = 0;
    const tagCounts = new Map<string, number>();
    const medCounts = new Map<string, number>();
    const monthCounts = new Map<string, number>();

    for (const e of encounters) {
      if (e.sharedWithPatient) shared++;
      for (const t of e.problemTags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      for (const p of e.prescriptions) {
        totalPrescriptions++;
        const key = p.medicine.trim();
        medCounts.set(key, (medCounts.get(key) ?? 0) + 1);
      }
      const d = e.occurredAt;
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthCounts.set(mk, (monthCounts.get(mk) ?? 0) + 1);
    }

    const top = (m: Map<string, number>, n: number) =>
      [...m.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, n);

    // Last 6 months, oldest → newest, including empty months.
    const now = new Date();
    const visitsByMonth: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      visitsByMonth.push({ month: label, count: monthCounts.get(mk) ?? 0 });
    }

    return {
      totals: {
        visits: encounters.length,
        uniquePatients,
        prescriptions: totalPrescriptions,
        shared,
      },
      visitsByMonth,
      topProblems: top(tagCounts, 6),
      topMedicines: top(medCounts, 6),
    };
  }

  /** Edit own profile. Registration number and status stay locked. */
  async updateMe(userId: string, dto: UpdateDoctorDto) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
    return this.prisma.doctorProfile.update({
      where: { userId },
      data: {
        fullName: dto.fullName,
        specialization: dto.specialization,
        clinicName: dto.clinicName,
        city: dto.city,
        phone: dto.phone,
      },
    });
  }

  /** Create a new publication / achievement / paper by doctor */
  async createPublication(doctorUserId: string, dto: CreatePublicationDto) {
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });
    if (!doctorProfile) {
      throw new NotFoundException('Doctor profile not found');
    }

    return this.prisma.doctorPublication.create({
      data: {
        doctorUserId,
        title: dto.title.trim(),
        type: dto.type,
        summary: dto.summary.trim(),
        specialization: dto.specialization?.trim() || doctorProfile.specialization || null,
        tags: dto.tags || [],
        journalOrIssuer: dto.journalOrIssuer?.trim() || null,
        publicationUrl: dto.publicationUrl?.trim() || null,
        year: dto.year || new Date().getFullYear(),
      },
      include: {
        doctor: {
          select: {
            doctorProfile: {
              select: {
                fullName: true,
                specialization: true,
                clinicName: true,
                city: true,
                registrationNumber: true,
              },
            },
          },
        },
      },
    });
  }

  /** Retrieve publications list with filter, search, author details and current user's like state */
  async findAllPublications(
    currentUserId: string,
    query: { type?: PublicationType; search?: string; mine?: boolean },
  ) {
    const where: Prisma.DoctorPublicationWhereInput = {};

    if (query.mine) {
      where.doctorUserId = currentUserId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { summary: { contains: s, mode: 'insensitive' } },
        { specialization: { contains: s, mode: 'insensitive' } },
        { journalOrIssuer: { contains: s, mode: 'insensitive' } },
        { tags: { has: s } },
        {
          doctor: {
            doctorProfile: {
              fullName: { contains: s, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const publications = await this.prisma.doctorPublication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          select: {
            id: true,
            doctorProfile: {
              select: {
                fullName: true,
                specialization: true,
                clinicName: true,
                city: true,
                registrationNumber: true,
              },
            },
          },
        },
        likes: {
          where: { userId: currentUserId },
          select: { id: true },
        },
      },
    });

    return publications.map((pub) => {
      const hasLiked = pub.likes.length > 0;
      const { likes, ...rest } = pub;
      return {
        ...rest,
        hasLiked,
        isMine: pub.doctorUserId === currentUserId,
        author: {
          userId: pub.doctorUserId,
          fullName: pub.doctor.doctorProfile?.fullName ?? 'Verified Doctor',
          specialization: pub.doctor.doctorProfile?.specialization ?? pub.specialization ?? 'Specialist',
          clinicName: pub.doctor.doctorProfile?.clinicName ?? null,
          city: pub.doctor.doctorProfile?.city ?? null,
          registrationNumber: pub.doctor.doctorProfile?.registrationNumber ?? null,
        },
      };
    });
  }

  /** Delete publication - only owner doctor can delete */
  async deletePublication(doctorUserId: string, publicationId: string) {
    const pub = await this.prisma.doctorPublication.findUnique({
      where: { id: publicationId },
    });
    if (!pub) {
      throw new NotFoundException('Publication not found');
    }
    if (pub.doctorUserId !== doctorUserId) {
      throw new ForbiddenException('You can only delete your own publications');
    }

    await this.prisma.doctorPublication.delete({
      where: { id: publicationId },
    });

    return { success: true, message: 'Publication deleted successfully' };
  }

  /** Toggle like on a publication */
  async toggleLike(userId: string, publicationId: string) {
    const pub = await this.prisma.doctorPublication.findUnique({
      where: { id: publicationId },
    });
    if (!pub) {
      throw new NotFoundException('Publication not found');
    }

    const existing = await this.prisma.doctorPublicationLike.findUnique({
      where: {
        publicationId_userId: {
          publicationId,
          userId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.doctorPublicationLike.delete({
          where: { id: existing.id },
        }),
        this.prisma.doctorPublication.update({
          where: { id: publicationId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      const updated = Math.max(0, pub.likesCount - 1);
      return { liked: false, likesCount: updated };
    } else {
      await this.prisma.$transaction([
        this.prisma.doctorPublicationLike.create({
          data: {
            publicationId,
            userId,
          },
        }),
        this.prisma.doctorPublication.update({
          where: { id: publicationId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      return { liked: true, likesCount: pub.likesCount + 1 };
    }
  }
}

