import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InventoryController } from '../controllers/inventory.controller.js';
import { InventoryService } from '../../../application/services/inventory.service.js';
import { INVENTORY_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { InMemoryInventoryRepository } from '../../../infrastructure/persistence/inmemory/InMemoryInventoryRepository.js';
import { PrismaInventoryRepository } from '../../../infrastructure/persistence/prisma/PrismaInventoryRepository.js';
import { OracleInventoryRepository } from '../../../infrastructure/persistence/oracle/OracleInventoryRepository.js';

@Module({
  controllers: [InventoryController],
  providers: [
    InventoryService,
    PrismaService,
    OracleService,
    InMemoryInventoryRepository,
    {
      provide: INVENTORY_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryInventoryRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemoryInventoryRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleInventoryRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaInventoryRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class InventoryModule {}
