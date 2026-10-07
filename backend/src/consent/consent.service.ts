import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { ConsentScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { DoctorAccessService } from '../doctor/doctor-access.service';

const CODE_TTL_MS = 15 * 60 * 1000; // 15 min to redeem
const SESSION_TTL_MS = 60 * 60 * 1000; // 60 min of access once redeemed
// No ambiguous characters (0/O, 1/I/L) so codes are easy to read out.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

@Injectable()
export class ConsentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly doctorAccess: DoctorAccessService,
  ) {}

  private makeCode(len = 10): string {
    const bytes = randomBytes(len);
    let s = '';
    for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
    return s;
  }

  private hash(code: string): string {
    return createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
  }

  // ---- Patient side ---------------------------------------------------------

  /** Patient/guardian generates a one-time code for a chosen profile. */
  async generate(userId: string, patientId: string, scope: ConsentScope) {
    await this.access.assertAccess(userId, patientId); // must be able to share it

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { fullName: true },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    // Supersede any earlier still-pending code for this profile.
    await this.prisma.consentGrant.updateMany({
      where: { patientId, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    });

    const code = this.makeCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);
    const grant = await this.prisma.consentGrant.create({
      data: { patientId, codeHash: this.hash(code), scope, expiresAt },
    });

    return {
      id: grant.id,
      code,
      scope,
      patientId,
      patientName: patient.fullName,
      expiresAt,
    };
  }

  /** List the codes/sessions currently live for the caller's profiles. */
  async listActive(userId: string) {
    const now = new Date();
    const grants = await this.prisma.consentGrant.findMany({
      where: {
        patient: this.access.patientWhere(userId),
        status: { in: ['PENDING', 'USED'] },
      },
      orderBy: { createdAt: 'desc' },
      include: { patient: { select: { fullName: true } } },
    });

    const live = grants.filter((g) =>
      g.status === 'PENDING'
        ? g.expiresAt > now
        : !!g.accessExpiresAt && g.accessExpiresAt > now,
    );

    // Resolve doctor names for redeemed sessions.
    const doctorIds = [...new Set(live.map((g) => g.doctorUserId).filter(Boolean))] as string[];
    const doctors = doctorIds.length
      ? await this.prisma.doctorProfile.findMany({
          where: { userId: { in: doctorIds } },
          select: { userId: true, fullName: true, specialization: true },
        })
      : [];
    const docById = new Map(doctors.map((d) => [d.userId, d]));

    return live.map((g) => ({
      id: g.id,
      patientId: g.patientId,
      patientName: g.patient.fullName,
      scope: g.scope,
      status: g.status,
      expiresAt: g.expiresAt,
      accessExpiresAt: g.accessExpiresAt,
      doctor: g.doctorUserId
        ? {
            name: docById.get(g.doctorUserId)?.fullName ?? 'A doctor',
            specialization: docById.get(g.doctorUserId)?.specialization ?? null,
          }
        : null,
    }));
  }

  /** Patient revokes a code / ends a live session. */
  async revoke(userId: string, consentId: string) {
    const grant = await this.prisma.consentGrant.findUnique({
      where: { id: consentId },
    });
    if (!grant) throw new NotFoundException('Consent not found');
    await this.access.assertAccess(userId, grant.patientId);
    await this.prisma.consentGrant.update({
      where: { id: consentId },
      data: { status: 'REVOKED', accessExpiresAt: new Date() },
    });
    return { revoked: true };
  }

  // ---- Doctor side ----------------------------------------------------------

  /** A doctor redeems a code: opens a 60-min session and starts an encounter. */
  async consume(doctorUserId: string, rawCode: string) {
    const grant = await this.prisma.consentGrant.findUnique({
      where: { codeHash: this.hash(rawCode) },
    });
    if (!grant || grant.status !== 'PENDING') {
      throw new BadRequestException('This code is invalid or already used.');
    }
    if (grant.expiresAt.getTime() < Date.now()) {
      await this.prisma.consentGrant.update({
        where: { id: grant.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('This code has expired.');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: grant.patientId },
      select: { id: true, fullName: true, dob: true, gender: true },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const encounter = await this.prisma.$transaction(async (tx) => {
      await tx.consentGrant.update({
        where: { id: grant.id },
        data: {
          status: 'USED',
          doctorUserId,
          usedAt: new Date(),
          accessExpiresAt: sessionExpiresAt,
        },
      });
      return tx.encounter.create({
        data: {
          doctorUserId,
          patientId: patient.id,
          patientName: patient.fullName,
        },
        select: { id: true },
      });
    });

    return {
      encounterId: encounter.id,
      scope: grant.scope,
      sessionExpiresAt,
      patient,
    };
  }

  /**
   * The patient's full record set for the doctor to view during a live visit.
   * Gated by an active consent session (403 otherwise).
   */
  async getPatientRecords(doctorUserId: string, patientId: string) {
    const grant = await this.doctorAccess.assertConsent(doctorUserId, patientId);

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        fullName: true,
        dob: true,
        gender: true,
        healthId: true,
        nationality: true,
        healthConditions: true,
        hasPriorComplications: true,
        complicationNotes: true,
        hasSurgicalComplications: true,
        surgicalComplicationNotes: true,
        height: true,
        weight: true,
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const records = await this.prisma.vaccinationRecord.findMany({
      where: { patientId },
      include: {
        vaccine: true,
        provider: true,
        certificate: { select: { id: true, verificationCode: true } },
      },
      orderBy: { dateAdministered: 'desc' },
    });

    // The current visit's encounter (created at consume) carries the note.
    const encounter = await this.prisma.encounter.findFirst({
      where: { doctorUserId, patientId },
      orderBy: { occurredAt: 'desc' },
      include: { prescriptions: true },
    });

    return {
      patient,
      records,
      encounter,
      session: { scope: grant.scope, expiresAt: grant.accessExpiresAt },
    };
  }

  /**
   * Save the doctor's consultation note (problem, recommendation, prescription)
   * onto the current visit's encounter. Consent-gated; the note persists after.
   */
  async saveNote(
    doctorUserId: string,
    patientId: string,
    dto: {
      problem?: string;
      problemTags?: string[];
      recommendation?: string;
      prescriptionText?: string;
      sharedWithPatient?: boolean;
      note?: string;
      prescriptions?: {
        medicine: string;
        dosage?: string;
        frequency?: string;
        durationDays?: number;
      }[];
    },
  ) {
    await this.doctorAccess.assertConsent(doctorUserId, patientId);
    const encounter = await this.prisma.encounter.findFirst({
      where: { doctorUserId, patientId },
      orderBy: { occurredAt: 'desc' },
    });
    if (!encounter) {
      throw new NotFoundException('No active visit to attach the note to.');
    }

    const items = (dto.prescriptions ?? [])
      .filter((i) => i.medicine && i.medicine.trim())
      .map((i) => ({
        medicine: i.medicine.trim(),
        dosage: i.dosage?.trim() || null,
        frequency: i.frequency?.trim() || null,
        durationDays: i.durationDays ?? null,
      }));

    return this.prisma.$transaction(async (tx) => {
      // Replace the structured prescription rather than merge.
      await tx.prescriptionItem.deleteMany({ where: { encounterId: encounter.id } });
      return tx.encounter.update({
        where: { id: encounter.id },
        data: {
          problem: dto.problem,
          problemTags: dto.problemTags,
          recommendation: dto.recommendation,
          prescriptionText: dto.prescriptionText,
          sharedWithPatient: dto.sharedWithPatient,
          note: dto.note,
          prescriptions: { create: items },
        },
        include: { prescriptions: true },
      });
    });
  }
}
