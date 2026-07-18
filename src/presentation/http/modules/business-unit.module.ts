import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessUnitController } from '../controllers/business-unit.controller.js';
import { BusinessUnitService } from '../../../application/services/business-unit.service.js';
import { BUSINESS_UNIT_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { InMemoryBusinessUnitRepository } from '../../../infrastructure/persistence/inmemory/InMemoryBusinessUnitRepository.js';
import { PrismaBusinessUnitRepository } from '../../../infrastructure/persistence/prisma/PrismaBusinessUnitRepository.js';
import { OracleBusinessUnitRepository } from '../../../infrastructure/persistence/oracle/OracleBusinessUnitRepository.js';

@Module({
  controllers: [BusinessUnitController],
  providers: [
    BusinessUnitService,
    PrismaService,
    OracleService,
    InMemoryBusinessUnitRepository,
    {
      provide: BUSINESS_UNIT_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryBusinessUnitRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemoryBusinessUnitRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleBusinessUnitRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaBusinessUnitRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class BusinessUnitModule {}
