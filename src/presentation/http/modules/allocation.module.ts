import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllocationService } from '../../../application/services/allocation.service.js';
import { ALLOCATION_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { InMemoryAllocationRepository } from '../../../infrastructure/persistence/inmemory/InMemoryAllocationRepository.js';
import { OracleAllocationRepository } from '../../../infrastructure/persistence/oracle/OracleAllocationRepository.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { PrismaAllocationRepository } from '../../../infrastructure/persistence/prisma/PrismaAllocationRepository.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { AllocationController } from '../controllers/allocation.controller.js';

@Module({
  controllers: [AllocationController],
  providers: [
    AllocationService,
    PrismaService,
    OracleService,
    InMemoryAllocationRepository,
    {
      provide: ALLOCATION_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryAllocationRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemoryAllocationRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleAllocationRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaAllocationRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class AllocationModule {}
