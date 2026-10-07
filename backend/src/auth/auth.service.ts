import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create the account, the person's own "self" profile, and the access link
    // that lets them reach it — all atomically.
    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email: dto.email, passwordHash },
      });
      const patient = await tx.patient.create({
        data: { ownerId: u.id, fullName: dto.fullName, relation: 'SELF' },
      });
      await tx.patientAccess.create({
        data: { patientId: patient.id, userId: u.id, role: 'SELF' },
      });
      return u;
    });

    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async getProfile(userId: string) {
    // List profiles via the access table so shared/claimed profiles appear too,
    // each tagged with how this user reaches it (SELF vs GUARDIAN).
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        accesses: {
          orderBy: { createdAt: 'asc' },
          select: {
            role: true,
            patient: {
              select: {
                id: true,
                fullName: true,
                relation: true,
                healthId: true,
                dob: true,
                gender: true,
                nationality: true,
                idProofType: true,
                idProofNumber: true,
                healthConditions: true,
                hasPriorComplications: true,
                complicationNotes: true,
                hasSurgicalComplications: true,
                surgicalComplicationNotes: true,
                height: true,
                weight: true,
              },
            },
          },
        },
      },
    });
    if (!user) {
      return null;
    }
    const { accesses, ...rest } = user;
    return {
      ...rest,
      patients: accesses.map((a) => ({ ...a.patient, accessRole: a.role })),
    };
  }

  private buildAuthResponse(id: string, email: string, role: Role) {
    const accessToken = this.jwt.sign({ sub: id, email, role });
    return {
      accessToken,
      user: { id, email, role },
    };
  }
}
