import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VendorController } from '../controllers/vendor.controller.js';
import { VendorContextController } from '../controllers/vendor-context.controller.js';
import { VendorService } from '../../../application/services/vendor.service.js';
import { VENDOR_REPOSITORY } from '../../../domain/repositories/tokens.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { InMemoryVendorRepository } from '../../../infrastructure/persistence/inmemory/InMemoryVendorRepository.js';
import { PrismaVendorRepository } from '../../../infrastructure/persistence/prisma/PrismaVendorRepository.js';
import { OracleVendorRepository } from '../../../infrastructure/persistence/oracle/OracleVendorRepository.js';

@Module({
  controllers: [VendorController, VendorContextController],
  providers: [
    VendorService,
    PrismaService,
    OracleService,
    InMemoryVendorRepository,
    {
      provide: VENDOR_REPOSITORY,
      inject: [ConfigService, PrismaService, OracleService, InMemoryVendorRepository],
      useFactory: (
        configService: ConfigService,
        prismaService: PrismaService,
        oracleService: OracleService,
        inMemoryRepository: InMemoryVendorRepository
      ) => {
        const provider = String(configService.get<string>('env.dbProvider') ?? 'supabase');

        if (provider === 'oracle') {
          return new OracleVendorRepository(oracleService);
        }

        if (provider === 'supabase' || provider === 'postgres' || provider === 'postgresql') {
          return new PrismaVendorRepository(prismaService);
        }

        return inMemoryRepository;
      }
    }
  ]
})
export class VendorModule {}
