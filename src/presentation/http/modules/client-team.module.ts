import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientTeamController } from '../controllers/client-team.controller.js';
import { ClientTeamService } from '../../../application/services/client-team.service.js';
import { CLIENT_TEAM_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { InMemoryClientTeamRepository } from '../../../infrastructure/persistence/inmemory/InMemoryClientTeamRepository.js';
import { PrismaClientTeamRepository } from '../../../infrastructure/persistence/prisma/PrismaClientTeamRepository.js';
import { OracleClientTeamRepository } from '../../../infrastructure/persistence/oracle/OracleClientTeamRepository.js';

@Module({
  controllers: [ClientTeamController],
  providers: [
    ClientTeamService,
    PrismaService,
    OracleService,
    InMemoryClientTeamRepository,
    {
      provide: CLIENT_TEAM_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryClientTeamRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemoryClientTeamRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleClientTeamRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaClientTeamRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class ClientTeamModule {}
