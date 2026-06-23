import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkillController } from '../controllers/skill.controller.js';
import { SkillService } from '../../../application/services/skill.service.js';
import { SKILL_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { InMemorySkillRepository } from '../../../infrastructure/persistence/inmemory/InMemorySkillRepository.js';
import { PrismaSkillRepository } from '../../../infrastructure/persistence/prisma/PrismaSkillRepository.js';
import { OracleSkillRepository } from '../../../infrastructure/persistence/oracle/OracleSkillRepository.js';

@Module({
  controllers: [SkillController],
  providers: [
    SkillService,
    PrismaService,
    OracleService,
    InMemorySkillRepository,
    {
      provide: SKILL_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemorySkillRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemorySkillRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleSkillRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaSkillRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class SkillModule {}
