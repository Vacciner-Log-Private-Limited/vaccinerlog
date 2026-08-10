import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';

const REMINDER_INCLUDE = {
  vaccine: true,
  patient: { select: { id: true, fullName: true, relation: true } },
} as const;

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async assertOwnsPatient(ownerId: string, patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    if (patient.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have access to this patient');
    }
  }

  async create(ownerId: string, dto: CreateReminderDto) {
    await this.assertOwnsPatient(ownerId, dto.patientId);
    return this.prisma.reminder.create({
      data: {
        patientId: dto.patientId,
        vaccineId: dto.vaccineId,
        doseNumber: dto.doseNumber ?? 1,
        dueDate: new Date(dto.dueDate),
      },
      include: REMINDER_INCLUDE,
    });
  }

  findAllForUser(ownerId: string) {
    return this.prisma.reminder.findMany({
      where: { patient: { ownerId } },
      include: REMINDER_INCLUDE,
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(ownerId: string, id: string) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
      include: { vaccine: true, patient: true },
    });
    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }
    if (reminder.patient.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have access to this reminder');
    }
    return reminder;
  }

  async update(ownerId: string, id: string, dto: UpdateReminderDto) {
    await this.findOne(ownerId, id); // ownership check
    return this.prisma.reminder.update({
      where: { id },
      data: {
        vaccineId: dto.vaccineId,
        doseNumber: dto.doseNumber,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
      },
      include: REMINDER_INCLUDE,
    });
  }

  async complete(ownerId: string, id: string) {
    await this.findOne(ownerId, id);
    return this.prisma.reminder.update({
      where: { id },
      data: { status: 'DONE' },
      include: REMINDER_INCLUDE,
    });
  }

  async remove(ownerId: string, id: string) {
    await this.findOne(ownerId, id);
    await this.prisma.reminder.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Scheduled job: every minute, find PENDING reminders whose due date has
   * passed and mark them as SENT (i.e. the user has been notified). In a real
   * system this is where an SMS / push / email would actually be dispatched.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processDueReminders() {
    const now = new Date();
    const due = await this.prisma.reminder.findMany({
      where: { status: 'PENDING', dueDate: { lte: now } },
      select: { id: true },
    });
    if (due.length === 0) {
      return;
    }
    await this.prisma.reminder.updateMany({
      where: { id: { in: due.map((d) => d.id) } },
      data: { status: 'SENT' },
    });
    this.logger.log(`Dispatched ${due.length} due reminder(s).`);
  }
}
