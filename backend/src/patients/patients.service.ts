import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AccessRole, Relation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async create(userId: string, dto: CreatePatientDto) {
    const relation = dto.relation ?? Relation.OTHER;
    // Adding a family member makes you their guardian; your own SELF profile
    // (only created at registration) is the exception.
    const role =
      relation === Relation.SELF ? AccessRole.SELF : AccessRole.GUARDIAN;

    const patient = await this.prisma.patient.create({
      data: {
        ownerId: userId,
        fullName: dto.fullName,
        relation,
        dob: dto.dob ? new Date(dto.dob) : null,
        gender: dto.gender ?? null,
        healthId: dto.healthId ?? null,
        phone: dto.phone ?? null,
        nationality: dto.nationality ?? null,
        idProofType: dto.idProofType ?? null,
        idProofNumber: dto.idProofNumber ?? null,
        healthConditions: dto.healthConditions ?? [],
        hasPriorComplications: dto.hasPriorComplications ?? null,
        complicationNotes:
          dto.hasPriorComplications === true
            ? (dto.complicationNotes ?? null)
            : null,
        hasSurgicalComplications: dto.hasSurgicalComplications ?? null,
        surgicalComplicationNotes:
          dto.hasSurgicalComplications === true
            ? (dto.surgicalComplicationNotes ?? null)
            : null,
        height: dto.height ?? null,
        weight: dto.weight ?? null,
        // Access source of truth: the creator can reach this profile.
        accesses: { create: { userId, role } },
      },
    });
    return { ...patient, accessRole: role };
  }

  async findAll(userId: string) {
    const patients = await this.prisma.patient.findMany({
      where: this.access.patientWhere(userId),
      orderBy: { createdAt: 'asc' },
      include: { accesses: { where: { userId }, select: { role: true } } },
    });
    return patients.map(({ accesses, ...p }) => ({
      ...p,
      accessRole: accesses[0]?.role ?? null,
    }));
  }

  /**
   * Fetch a single patient and verify the current user can access it.
   * Used as the access gate for reads, updates and deletes.
   */
  async findOne(userId: string, id: string) {
    await this.access.assertAccess(userId, id);
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: { accesses: { where: { userId }, select: { role: true } } },
    });
    const { accesses, ...rest } = patient!;
    return { ...rest, accessRole: accesses[0]?.role ?? null };
  }

  async update(userId: string, id: string, dto: UpdatePatientDto) {
    await this.access.assertAccess(userId, id);
    // When a "complications" question is explicitly answered No, wipe any stale
    // note; when it isn't part of this update, leave the note untouched.
    const complicationNotes =
      dto.hasPriorComplications === false ? null : dto.complicationNotes;
    const surgicalComplicationNotes =
      dto.hasSurgicalComplications === false ? null : dto.surgicalComplicationNotes;
    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        relation: dto.relation,
        gender: dto.gender,
        healthId: dto.healthId,
        phone: dto.phone,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        nationality: dto.nationality,
        idProofType: dto.idProofType,
        idProofNumber: dto.idProofNumber,
        healthConditions: dto.healthConditions,
        hasPriorComplications: dto.hasPriorComplications,
        complicationNotes,
        hasSurgicalComplications: dto.hasSurgicalComplications,
        surgicalComplicationNotes,
        height: dto.height,
        weight: dto.weight,
      },
    });
    return patient;
  }

  async remove(userId: string, id: string) {
    await this.access.assertAccess(userId, id);

    const accesses = await this.prisma.patientAccess.findMany({
      where: { patientId: id },
      select: { userId: true, role: true },
    });
    const mine = accesses.find((a) => a.userId === userId);

    if (mine?.role === AccessRole.SELF) {
      throw new ForbiddenException('You cannot delete your own primary profile');
    }
    // If the profile is shared (e.g. the member has claimed their own login),
    // deleting would wipe their data too — make them revoke access instead.
    if (accesses.length > 1) {
      throw new BadRequestException(
        'This profile is shared with another account. Remove that access before deleting.',
      );
    }

    await this.prisma.patient.delete({ where: { id } });
    return { deleted: true };
  }
}
