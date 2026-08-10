import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVaccineDto } from './dto/create-vaccine.dto';

@Injectable()
export class VaccinesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateVaccineDto) {
    return this.prisma.vaccine.create({
      data: {
        name: dto.name,
        description: dto.description,
        totalDoses: dto.totalDoses ?? 1,
      },
    });
  }

  findAll() {
    return this.prisma.vaccine.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const vaccine = await this.prisma.vaccine.findUnique({ where: { id } });
    if (!vaccine) {
      throw new NotFoundException('Vaccine not found');
    }
    return vaccine;
  }
}
