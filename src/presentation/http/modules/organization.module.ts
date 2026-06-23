import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrganizationController } from '../controllers/organization.controller.js';
import { OrganizationService } from '../../../application/services/organization.service.js';
import { ORGANIZATION_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { InMemoryOrganizationRepository } from '../../../infrastructure/persistence/inmemory/InMemoryOrganizationRepository.js';
import { PrismaOrganizationRepository } from '../../../infrastructure/persistence/prisma/PrismaOrganizationRepository.js';
import { OracleOrganizationRepository } from '../../../infrastructure/persistence/oracle/OracleOrganizationRepository.js';

@Module({
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    PrismaService,
    OracleService,
    InMemoryOrganizationRepository,
    {
      provide: ORGANIZATION_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryOrganizationRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemoryOrganizationRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleOrganizationRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaOrganizationRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class OrganizationModule {}
