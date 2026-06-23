import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbsenceService } from '../../../application/services/absence.service.js';
import { ABSENCE_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { InMemoryAbsenceRepository } from '../../../infrastructure/persistence/inmemory/InMemoryAbsenceRepository.js';
import { OracleAbsenceRepository } from '../../../infrastructure/persistence/oracle/OracleAbsenceRepository.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { PrismaAbsenceRepository } from '../../../infrastructure/persistence/prisma/PrismaAbsenceRepository.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { AbsenceController } from '../controllers/absence.controller.js';

@Module({
  controllers: [AbsenceController],
  providers: [
    AbsenceService,
    PrismaService,
    OracleService,
    InMemoryAbsenceRepository,
    {
      provide: ABSENCE_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryAbsenceRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemoryAbsenceRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleAbsenceRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaAbsenceRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class AbsenceModule {}
