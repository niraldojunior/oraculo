import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DepartmentController } from '../controllers/department.controller.js';
import { DepartmentService } from '../../../application/services/department.service.js';
import { DEPARTMENT_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { InMemoryDepartmentRepository } from '../../../infrastructure/persistence/inmemory/InMemoryDepartmentRepository.js';
import { PrismaDepartmentRepository } from '../../../infrastructure/persistence/prisma/PrismaDepartmentRepository.js';
import { OracleDepartmentRepository } from '../../../infrastructure/persistence/oracle/OracleDepartmentRepository.js';

@Module({
  controllers: [DepartmentController],
  providers: [
    DepartmentService,
    PrismaService,
    OracleService,
    InMemoryDepartmentRepository,
    {
      provide: DEPARTMENT_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryDepartmentRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemoryDepartmentRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleDepartmentRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaDepartmentRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class DepartmentModule {}
