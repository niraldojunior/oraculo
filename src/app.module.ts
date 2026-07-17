import {
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe
} from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { HealthModule } from './presentation/http/modules/health.module.js';
import { InitiativeModule } from './presentation/http/modules/initiative.module.js';
import { CompanyModule } from './presentation/http/modules/company.module.js';
import { DepartmentModule } from './presentation/http/modules/department.module.js';
import { ContractModule } from './presentation/http/modules/contract.module.js';
import { SkillModule } from './presentation/http/modules/skill.module.js';
import { VendorModule } from './presentation/http/modules/vendor.module.js';
import { OrganizationModule } from './presentation/http/modules/organization.module.js';
import { InventoryModule } from './presentation/http/modules/inventory.module.js';
import { SystemModule } from './presentation/http/modules/system.module.js';
import { AbsenceModule } from './presentation/http/modules/absence.module.js';
import { HolidayModule } from './presentation/http/modules/holiday.module.js';
import { AllocationModule } from './presentation/http/modules/allocation.module.js';
import { CoreModule } from './presentation/http/modules/core.module.js';
import { AzureModule } from './presentation/http/modules/azure.module.js';
import { ImageModule } from './presentation/http/modules/image.module.js';
import { SpaFallbackModule } from './presentation/http/modules/spa-fallback.module.js';
import { HttpExceptionFilter } from './advice/http-exception.filter.js';
import { envConfig } from './config/env.config.js';
import { CacheModule } from './infrastructure/cache/cache.module.js';
import { JsonLoggerService } from './infrastructure/log/logger.service.js';
import { RequestLoggingMiddleware } from './infrastructure/log/request-logging.middleware.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig]
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'dist'),
      exclude: ['/api/{*splat}']
    }),
    CacheModule,
    HealthModule,
    InitiativeModule,
    CompanyModule,
    DepartmentModule,
    ContractModule,
    SkillModule,
    VendorModule,
    OrganizationModule,
    InventoryModule,
    SystemModule,
    AbsenceModule,
    HolidayModule,
    AllocationModule,
    CoreModule,
    AzureModule,
    ImageModule,
    SpaFallbackModule
  ],
  providers: [
    JsonLoggerService,
    RequestLoggingMiddleware,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
        transformOptions: { enableImplicitConversion: true }
      })
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
