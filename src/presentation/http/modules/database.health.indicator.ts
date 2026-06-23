import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly oracleService: OracleService
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const provider = String(this.configService.get<string>('env.dbProvider') ?? 'supabase');

    try {
      if (provider === 'oracle') {
        await this.oracleService.query('SELECT 1 AS "ok" FROM DUAL');
      } else {
        await this.prismaService.$queryRaw`SELECT 1`;
      }

      return this.getStatus(key, true, { provider });
    } catch (error) {
      throw new HealthCheckError(
        'Database health check failed',
        this.getStatus(key, false, {
          provider,
          message: error instanceof Error ? error.message : String(error)
        })
      );
    }
  }
}
