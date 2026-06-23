import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContractController } from '../controllers/contract.controller.js';
import { ContractService } from '../../../application/services/contract.service.js';
import { CONTRACT_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { InMemoryContractRepository } from '../../../infrastructure/persistence/inmemory/InMemoryContractRepository.js';
import { PrismaContractRepository } from '../../../infrastructure/persistence/prisma/PrismaContractRepository.js';
import { OracleContractRepository } from '../../../infrastructure/persistence/oracle/OracleContractRepository.js';

@Module({
  controllers: [ContractController],
  providers: [
    ContractService,
    PrismaService,
    OracleService,
    InMemoryContractRepository,
    {
      provide: CONTRACT_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryContractRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemoryContractRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleContractRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaContractRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class ContractModule {}
