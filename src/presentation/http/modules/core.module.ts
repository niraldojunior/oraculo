import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../../application/services/auth.service.js';
import { AUTH_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { InMemoryAuthRepository } from '../../../infrastructure/persistence/inmemory/InMemoryAuthRepository.js';
import { OracleAuthRepository } from '../../../infrastructure/persistence/oracle/OracleAuthRepository.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { PrismaAuthRepository } from '../../../infrastructure/persistence/prisma/PrismaAuthRepository.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { CoreController } from '../controllers/core.controller.js';

@Module({
  controllers: [CoreController],
  providers: [
    AuthService,
    PrismaService,
    OracleService,
    InMemoryAuthRepository,
    {
      provide: AUTH_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryAuthRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemoryAuthRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleAuthRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaAuthRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class CoreModule {}
