import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CLIENT_TEAM_REPOSITORY, INITIATIVE_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { InMemoryClientTeamRepository } from '../../../infrastructure/persistence/inmemory/InMemoryClientTeamRepository.js';
import { InMemoryInitiativeRepository } from '../../../infrastructure/persistence/inmemory/InMemoryInitiativeRepository.js';
import { OracleClientTeamRepository } from '../../../infrastructure/persistence/oracle/OracleClientTeamRepository.js';
import { OracleInitiativeRepository } from '../../../infrastructure/persistence/oracle/OracleInitiativeRepository.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { PrismaClientTeamRepository } from '../../../infrastructure/persistence/prisma/PrismaClientTeamRepository.js';
import { PrismaInitiativeRepository } from '../../../infrastructure/persistence/prisma/PrismaInitiativeRepository.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';

function isPrismaProvider(provider: string): boolean {
  return provider === 'supabase' || provider === 'postgres' || provider === 'postgresql';
}

@Module({
  providers: [
    PrismaService,
    OracleService,
    InMemoryClientTeamRepository,
    {
      provide: InMemoryInitiativeRepository,
      inject: [InMemoryClientTeamRepository],
      useFactory: (clientTeams: InMemoryClientTeamRepository) => new InMemoryInitiativeRepository(clientTeams)
    },
    {
      provide: INITIATIVE_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryInitiativeRepository],
      useFactory: (
        config: ConfigService,
        prisma: PrismaService,
        oracle: OracleService,
        inMemory: InMemoryInitiativeRepository
      ) => {
        const provider = String(config.get<string>('env.dbProvider') ?? 'supabase');
        if (provider === 'oracle') return new OracleInitiativeRepository(oracle);
        if (isPrismaProvider(provider)) return new PrismaInitiativeRepository(prisma);
        return inMemory;
      }
    },
    {
      provide: CLIENT_TEAM_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryClientTeamRepository],
      useFactory: (
        config: ConfigService,
        prisma: PrismaService,
        oracle: OracleService,
        inMemory: InMemoryClientTeamRepository
      ) => {
        const provider = String(config.get<string>('env.dbProvider') ?? 'supabase');
        if (provider === 'oracle') return new OracleClientTeamRepository(oracle);
        if (isPrismaProvider(provider)) return new PrismaClientTeamRepository(prisma);
        return inMemory;
      }
    }
  ],
  exports: [INITIATIVE_REPOSITORY, CLIENT_TEAM_REPOSITORY]
})
export class InitiativeClientTeamPersistenceModule {}
