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

    // Create the account together with the person's own "self" patient profile.
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        patients: {
          create: {
            fullName: dto.fullName,
            relation: 'SELF',
          },
        },
      },
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
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        patients: {
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
          },
        },
      },
    });
  }

  private buildAuthResponse(id: string, email: string, role: Role) {
    const accessToken = this.jwt.sign({ sub: id, email, role });
    return {
      accessToken,
      user: { id, email, role },
    };
  }
}
