import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InitiativeService } from '../../../application/services/initiative.service.js';
import { InitiativeController } from '../controllers/initiative.controller.js';
import { INITIATIVE_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { InMemoryInitiativeRepository } from '../../../infrastructure/persistence/inmemory/InMemoryInitiativeRepository.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { PrismaInitiativeRepository } from '../../../infrastructure/persistence/prisma/PrismaInitiativeRepository.js';
import { OracleInitiativeRepository } from '../../../infrastructure/persistence/oracle/OracleInitiativeRepository.js';

@Module({
  controllers: [InitiativeController],
  providers: [
    InitiativeService,
    PrismaService,
    OracleService,
    InMemoryInitiativeRepository,
    {
      provide: INITIATIVE_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryInitiativeRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemoryInitiativeRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleInitiativeRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaInitiativeRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class InitiativeModule {}
