import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Relation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, dto: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        ownerId,
        fullName: dto.fullName,
        relation: dto.relation ?? Relation.OTHER,
        dob: dto.dob ? new Date(dto.dob) : null,
        gender: dto.gender ?? null,
        healthId: dto.healthId ?? null,
        phone: dto.phone ?? null,
        nationality: dto.nationality ?? null,
        idProofType: dto.idProofType ?? null,
        idProofNumber: dto.idProofNumber ?? null,
      },
    });
  }

  findAll(ownerId: string) {
    return this.prisma.patient.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Fetch a single patient and verify the current user owns it.
   * Used as the ownership gate for reads, updates and deletes.
   */
  async findOne(ownerId: string, id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    if (patient.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have access to this patient');
    }
    return patient;
  }

  async update(ownerId: string, id: string, dto: UpdatePatientDto) {
    await this.findOne(ownerId, id); // ownership check
    return this.prisma.patient.update({
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
      },
    });
  }

  async remove(ownerId: string, id: string) {
    const patient = await this.findOne(ownerId, id);
    if (patient.relation === Relation.SELF) {
      throw new ForbiddenException(
        'You cannot delete your own primary profile',
      );
    }
    await this.prisma.patient.delete({ where: { id } });
    return { deleted: true };
  }
}
