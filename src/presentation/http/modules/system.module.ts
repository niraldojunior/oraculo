import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemService } from '../../../application/services/system.service.js';
import { SYSTEM_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { InMemorySystemRepository } from '../../../infrastructure/persistence/inmemory/InMemorySystemRepository.js';
import { OracleSystemRepository } from '../../../infrastructure/persistence/oracle/OracleSystemRepository.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { PrismaSystemRepository } from '../../../infrastructure/persistence/prisma/PrismaSystemRepository.js';
import { SystemController } from '../controllers/system.controller.js';

@Module({
  controllers: [SystemController],
  providers: [
    SystemService,
    PrismaService,
    OracleService,
    InMemorySystemRepository,
    {
      provide: SYSTEM_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemorySystemRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemorySystemRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleSystemRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaSystemRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class SystemModule {}
