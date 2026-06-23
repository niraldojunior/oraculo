import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompanyController } from '../controllers/company.controller.js';
import { CompanyService } from '../../../application/services/company.service.js';
import { COMPANY_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { InMemoryCompanyRepository } from '../../../infrastructure/persistence/inmemory/InMemoryCompanyRepository.js';
import { PrismaCompanyRepository } from '../../../infrastructure/persistence/prisma/PrismaCompanyRepository.js';
import { OracleCompanyRepository } from '../../../infrastructure/persistence/oracle/OracleCompanyRepository.js';

@Module({
  controllers: [CompanyController],
  providers: [
    CompanyService,
    PrismaService,
    OracleService,
    InMemoryCompanyRepository,
    {
      provide: COMPANY_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryCompanyRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemoryCompanyRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleCompanyRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaCompanyRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class CompanyModule {}
