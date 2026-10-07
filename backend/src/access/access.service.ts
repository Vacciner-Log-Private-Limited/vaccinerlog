import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * The single source of truth for "can this user touch this patient's data?".
 * Every records/certificates/reminders/patients endpoint routes its access
 * check through here — so there is one place to get authorization right.
 */
@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** True if the user has any access (SELF or GUARDIAN) to the patient. */
  async canAccess(userId: string, patientId: string): Promise<boolean> {
    const link = await this.prisma.patientAccess.findUnique({
      where: { patientId_userId: { patientId, userId } },
      select: { id: true },
    });
    return !!link;
  }

  /** 404 if the patient doesn't exist, 403 if the user has no access to it. */
  async assertAccess(userId: string, patientId: string): Promise<void> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    if (!(await this.canAccess(userId, patientId))) {
      throw new ForbiddenException('You do not have access to this patient');
    }
  }

  /** Prisma `where` fragment for "patients this user can access". */
  patientWhere(userId: string) {
    return { accesses: { some: { userId } } };
  }

  /** Grant (or update) a user's access to a patient. Idempotent. */
  grant(userId: string, patientId: string, role: AccessRole) {
    return this.prisma.patientAccess.upsert({
      where: { patientId_userId: { patientId, userId } },
      update: { role },
      create: { patientId, userId, role },
    });
  }
}
