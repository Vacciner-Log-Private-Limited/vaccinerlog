import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from './access.service';

const INVITE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const MIN_AGE_YEARS = 18;

@Injectable()
export class DelegationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  private hashCode(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private ageInYears(dob: Date): number {
    return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
  }

  /**
   * A guardian creates a claim invite for an adult member.
   * Returns the raw code ONCE — it is never stored (only its hash).
   */
  async createInvite(callerId: string, patientId: string, email: string) {
    await this.access.assertAccess(callerId, patientId); // caller must manage them

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, fullName: true, dob: true },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    if (!patient.dob) {
      throw new BadRequestException(
        "Set this member's date of birth before granting access.",
      );
    }
    if (this.ageInYears(patient.dob) < MIN_AGE_YEARS) {
      throw new BadRequestException(
        `Access can only be granted once the member is ${MIN_AGE_YEARS} or older.`,
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Invalidate any earlier pending invites for the same person + email.
    await this.prisma.invite.updateMany({
      where: { patientId, email: cleanEmail, status: 'PENDING' },
      data: { status: 'REVOKED' },
    });

    const rawCode = randomBytes(24).toString('base64url'); // ~192 bits
    await this.prisma.invite.create({
      data: {
        patientId,
        email: cleanEmail,
        codeHash: this.hashCode(rawCode),
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        createdById: callerId,
      },
    });

    return {
      code: rawCode,
      email: cleanEmail,
      patientName: patient.fullName,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    };
  }

  /**
   * The invited person (logged in) redeems the code to gain SELF access to
   * their existing profile. Single-use, expiring, and bound to their email.
   */
  async acceptInvite(callerId: string, callerEmail: string, rawCode: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { codeHash: this.hashCode((rawCode ?? '').trim()) },
    });
    // Same error for "not found" and "wrong status" so codes can't be probed.
    if (!invite || invite.status !== 'PENDING') {
      throw new BadRequestException('This invite code is invalid or already used.');
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'REVOKED' },
      });
      throw new BadRequestException('This invite code has expired.');
    }
    if (invite.email.toLowerCase() !== callerEmail.toLowerCase()) {
      throw new ForbiddenException(
        'This invite was issued for a different email address.',
      );
    }

    // Grant the caller SELF access to the existing profile (history is kept).
    await this.access.grant(callerId, invite.patientId, 'SELF');
    await this.prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    // Remove the caller's empty auto-created "self" placeholder profile so
    // they don't end up with a duplicate.
    const placeholders = await this.prisma.patient.findMany({
      where: {
        id: { not: invite.patientId },
        relation: 'SELF',
        accesses: { some: { userId: callerId, role: 'SELF' } },
        records: { none: {} },
        reminders: { none: {} },
      },
      select: { id: true },
    });
    if (placeholders.length > 0) {
      await this.prisma.patient.deleteMany({
        where: { id: { in: placeholders.map((p) => p.id) } },
      });
    }

    return this.prisma.patient.findUnique({
      where: { id: invite.patientId },
      select: { id: true, fullName: true, relation: true },
    });
  }

  /** List everyone who can access a profile (guardian view). */
  async listAccess(callerId: string, patientId: string) {
    await this.access.assertAccess(callerId, patientId);
    const rows = await this.prisma.patientAccess.findMany({
      where: { patientId },
      select: {
        userId: true,
        role: true,
        createdAt: true,
        user: { select: { email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      userId: r.userId,
      email: r.user.email,
      role: r.role,
      since: r.createdAt,
      isYou: r.userId === callerId,
    }));
  }

  /** Revoke a user's access. Cannot orphan the profile (last access stays). */
  async revoke(callerId: string, patientId: string, targetUserId: string) {
    await this.access.assertAccess(callerId, patientId);
    const all = await this.prisma.patientAccess.findMany({
      where: { patientId },
      select: { userId: true },
    });
    if (!all.some((a) => a.userId === targetUserId)) {
      throw new NotFoundException('That access does not exist.');
    }
    if (all.length <= 1) {
      throw new BadRequestException(
        'This is the only account with access — it cannot be removed.',
      );
    }
    await this.prisma.patientAccess.delete({
      where: { patientId_userId: { patientId, userId: targetUserId } },
    });
    return { revoked: true };
  }
}
