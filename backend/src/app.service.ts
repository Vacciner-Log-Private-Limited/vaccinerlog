import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liveness + database connectivity check.
   */
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      service: 'vacciner-log-api',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
