import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HolidayService } from '../../../application/services/holiday.service.js';
import { HOLIDAY_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { InMemoryHolidayRepository } from '../../../infrastructure/persistence/inmemory/InMemoryHolidayRepository.js';
import { OracleHolidayRepository } from '../../../infrastructure/persistence/oracle/OracleHolidayRepository.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { PrismaHolidayRepository } from '../../../infrastructure/persistence/prisma/PrismaHolidayRepository.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { HolidayController } from '../controllers/holiday.controller.js';

@Module({
  controllers: [HolidayController],
  providers: [
    HolidayService,
    PrismaService,
    OracleService,
    InMemoryHolidayRepository,
    {
      provide: HOLIDAY_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryHolidayRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemoryHolidayRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleHolidayRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaHolidayRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class HolidayModule {}
