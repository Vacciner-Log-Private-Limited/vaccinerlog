import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Allows only an APPROVED doctor through. Must be used AFTER JwtAuthGuard
 * (which populates request.user): `@UseGuards(JwtAuthGuard, ApprovedDoctorGuard)`.
 */
@Injectable()
export class ApprovedDoctorGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as { id: string; role: string } | undefined;
    if (!user || user.role !== Role.PROVIDER) {
      throw new ForbiddenException('Doctors only');
    }
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });
    if (!profile) {
      throw new ForbiddenException('No doctor profile for this account');
    }
    if (profile.status !== 'APPROVED') {
      throw new ForbiddenException('Your doctor account is not approved yet');
    }
    return true;
  }
}
