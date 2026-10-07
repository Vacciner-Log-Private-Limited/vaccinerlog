import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConsentGrant } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * The single checkpoint for "can this doctor see/act on this patient RIGHT NOW?".
 * A doctor has access only while a consent session they redeemed is still live.
 * (The doctor equivalent of AccessService.)
 */
@Injectable()
export class DoctorAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** The live consent session linking this doctor to this patient, or null. */
  activeGrant(doctorUserId: string, patientId: string): Promise<ConsentGrant | null> {
    return this.prisma.consentGrant.findFirst({
      where: {
        doctorUserId,
        patientId,
        status: 'USED',
        accessExpiresAt: { gt: new Date() },
      },
      orderBy: { accessExpiresAt: 'desc' },
    });
  }

  /** 403 unless a live consent session exists. Returns the grant when it does. */
  async assertConsent(doctorUserId: string, patientId: string): Promise<ConsentGrant> {
    const grant = await this.activeGrant(doctorUserId, patientId);
    if (!grant) {
      throw new ForbiddenException(
        'No active consent for this patient. Ask them to share a new code.',
      );
    }
    return grant;
  }
}
