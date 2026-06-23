import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from '../controllers/health.controller.js';
import { DatabaseHealthIndicator } from './database.health.indicator.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, PrismaService, OracleService]
})
export class HealthModule {}
