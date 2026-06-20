import type express from 'express';
import type { PrismaClient } from '@prisma/client';
import type { DatabaseProvider } from '../../infrastructure/persistence/database.runtime.js';
import type { OracleRuntime } from '../../infrastructure/persistence/oracle.runtime.js';
import { optimizeFieldInPlace } from '../../infrastructure/gateways/imageOptimizer.js';
import { OrganizationApplicationService } from '../../application/OrganizationApplicationService.js';
import { CompanyApplicationService } from '../../application/CompanyApplicationService.js';
import { DepartmentApplicationService } from '../../application/DepartmentApplicationService.js';
import { ContractApplicationService } from '../../application/ContractApplicationService.js';
import { SkillApplicationService } from '../../application/SkillApplicationService.js';
import { VendorApplicationService } from '../../application/VendorApplicationService.js';
import { PrismaCompanyRepository } from '../../infrastructure/persistence/PrismaCompanyRepository.js';
import { PrismaDepartmentRepository } from '../../infrastructure/persistence/PrismaDepartmentRepository.js';
import { PrismaContractRepository } from '../../infrastructure/persistence/PrismaContractRepository.js';
import { PrismaOrganizationRepository } from '../../infrastructure/persistence/PrismaOrganizationRepository.js';
import { PrismaSkillRepository } from '../../infrastructure/persistence/PrismaSkillRepository.js';
import { PrismaVendorRepository } from '../../infrastructure/persistence/PrismaVendorRepository.js';
import { OracleSkillRepository } from '../../infrastructure/persistence/OracleSkillRepository.js';
import { OracleCompanyRepository } from '../../infrastructure/persistence/OracleCompanyRepository.js';
import { OracleDepartmentRepository } from '../../infrastructure/persistence/OracleDepartmentRepository.js';
import { OracleVendorRepository } from '../../infrastructure/persistence/OracleVendorRepository.js';
import { OracleContractRepository } from '../../infrastructure/persistence/OracleContractRepository.js';
import { OracleOrganizationRepository } from '../../infrastructure/persistence/OracleOrganizationRepository.js';
import { createInitiativesRouter } from './initiatives/initiatives.routes.js';
import { createOrganizationRouter } from './organization/organization.routes.js';
import { sanitizeOrganizationCollaboratorDto, sanitizeOrganizationTeamDto } from './organization/organization.dto.js';
import { createSystemsRouter } from './systems/systems.routes.js';
import { sanitizeSystemDto } from './systems/systems.dto.js';
import { createVendorsRouter } from './vendors/vendors.routes.js';
import { sanitizeVendorDto } from './vendors/vendors.dto.js';
import { createContractsRouter } from './contracts/contracts.routes.js';
import { sanitizeContractDto } from './contracts/contracts.dto.js';
import { createAllocationsRouter } from './allocations/allocations.routes.js';
import { createDepartmentsRouter } from './departments/departments.routes.js';
import { createCompaniesRouter } from './companies/companies.routes.js';
import { sanitizeCompanyDto } from './companies/companies.dto.js';
import { createSkillsRouter } from './skills/skills.routes.js';
import { sanitizeSkillDto } from './skills/skills.dto.js';
import { createAbsencesRouter } from './absences/absences.routes.js';
import { createHolidaysRouter } from './holidays/holidays.routes.js';
import { createCoreRouter } from './core/core.routes.js';
import { createAzureRouter } from './azure/azure.routes.js';
import { createImagesRouter } from './images/images.routes.js';
import { createInventoryRouter } from './inventory/inventory.routes.js';
import { globalErrorHandler, requestLoggingMiddleware } from './shared/http.middlewares.js';
import {
  systemListOmit,
  companyListOmit,
  vendorListOmit,
  collaboratorSafeSelect,
  collaboratorDashboardSelect,
  vendorLiteSelect,
  normalizeTaskOrder,
  normalizeMilestoneOrder
} from './shared/query-shapes.js';
import {
  transformCollaboratorImage,
  transformCompanyImage,
  transformVendorImage,
  transformSkillImage
} from './shared/image.helpers.js';

type EntityImageFetcher = () => Promise<string | null | undefined>;

interface RegisterHttpRoutesDeps {
  provider: DatabaseProvider;
  prisma: PrismaClient | null;
  oracle: OracleRuntime | null;
  buildCacheKey: any;
  getCachedState: any;
  isRefreshing: any;
  markRefreshing: any;
  setCached: any;
  singleflight: any;
  serveSWR: any;
  invalidateCacheByPrefix: any;
  invalidateImageCacheByPrefix: any;
  serveEntityImage: (
    req: express.Request,
    res: express.Response,
    fetcher: EntityImageFetcher,
    cacheKey?: string
  ) => Promise<unknown>;
  ensureCompanyMatchesDept: any;
  getCommonWhere: any;
}

export function registerHttpRoutes(app: express.Application, deps: RegisterHttpRoutesDeps) {
  const {
    provider,
    prisma,
    oracle,
    buildCacheKey,
    getCachedState,
    isRefreshing,
    markRefreshing,
    setCached,
    singleflight,
    serveSWR,
    invalidateCacheByPrefix,
    invalidateImageCacheByPrefix,
    serveEntityImage,
    ensureCompanyMatchesDept,
    getCommonWhere
  } = deps;

  app.use(requestLoggingMiddleware);

  app.use(createCoreRouter({ prisma, oracle, provider }));
  app.use(createAzureRouter());

  if (!prisma) {
    app.use(createAllocationsRouter({
      prisma,
      oracle,
      provider
    }));

    app.use(createAbsencesRouter({
      prisma,
      oracle,
      provider
    }));

    app.use(createHolidaysRouter({
      prisma,
      oracle,
      provider
    }));

    app.use(createInventoryRouter({
      prisma,
      oracle,
      provider,
      buildCacheKey,
      serveSWR,
      setCached,
      getCommonWhere,
      systemListOmit,
      vendorListOmit,
      collaboratorSafeSelect,
      transformCollaboratorImage,
      transformVendorImage
    }));

    app.use(createInitiativesRouter({
      prisma,
      oracle,
      provider,
      buildCacheKey,
      getCachedState,
      isRefreshing,
      markRefreshing,
      singleflight,
      setCached,
      invalidateCacheByPrefix,
      serveSWR,
      normalizeMilestoneOrder,
      normalizeTaskOrder,
      getCommonWhere
    }));

    app.use(createImagesRouter({
      prisma,
      oracle,
      provider,
      serveEntityImage
    }));

    app.use(createSystemsRouter({
      prisma,
      oracle,
      provider,
      buildCacheKey,
      serveSWR,
      setCached,
      invalidateCacheByPrefix,
      getCommonWhere,
      sanitizeSystem: sanitizeSystemDto,
      ensureCompanyMatchesDept,
      systemListOmit
    }));

    if (oracle) {
      const companyRepository = new OracleCompanyRepository(oracle);
      const companyService = new CompanyApplicationService(companyRepository);

      app.use(createCompaniesRouter({
        companyService,
        buildCacheKey,
        serveSWR,
        setCached,
        invalidateCacheByPrefix,
        invalidateImageCacheByPrefix,
        optimizeFieldInPlace,
        sanitizeCompany: sanitizeCompanyDto,
        transformCompanyImage,
        companyListOmit
      }));

      const departmentRepository = new OracleDepartmentRepository(oracle);
      const departmentService = new DepartmentApplicationService(departmentRepository);

      app.use(createDepartmentsRouter({
        departmentService,
        buildCacheKey,
        serveSWR,
        setCached,
        invalidateCacheByPrefix
      }));

      const organizationRepository = new OracleOrganizationRepository(oracle);
      const organizationService = new OrganizationApplicationService(organizationRepository);

      app.use(createOrganizationRouter({
        organizationService,
        buildCacheKey,
        getCachedState,
        isRefreshing,
        markRefreshing,
        singleflight,
        setCached,
        invalidateCacheByPrefix,
        invalidateImageCacheByPrefix,
        serveSWR,
        getCommonWhere,
        sanitizeTeam: sanitizeOrganizationTeamDto,
        sanitizeCollaborator: sanitizeOrganizationCollaboratorDto,
        ensureCompanyMatchesDept,
        optimizeFieldInPlace,
        transformCollaboratorImage,
        collaboratorSafeSelect,
        collaboratorDashboardSelect
      }));

      const skillRepository = new OracleSkillRepository(oracle);
      const skillService = new SkillApplicationService(skillRepository);

      app.use(createSkillsRouter({
        skillService,
        optimizeFieldInPlace,
        invalidateImageCacheByPrefix,
        transformSkillImage,
        transformCollaboratorImage,
        sanitizeSkill: sanitizeSkillDto
      }));

      const vendorRepository = new OracleVendorRepository(oracle);
      const vendorService = new VendorApplicationService(vendorRepository);

      app.use(createVendorsRouter({
        vendorService,
        buildCacheKey,
        serveSWR,
        setCached,
        getCommonWhere,
        sanitizeVendor: sanitizeVendorDto,
        ensureCompanyMatchesDept,
        optimizeFieldInPlace,
        invalidateImageCacheByPrefix,
        transformVendorImage,
        transformCollaboratorImage,
        transformCompanyImage,
        collaboratorSafeSelect,
        vendorListOmit,
        systemListOmit,
        companyListOmit,
        vendorLiteSelect
      }));

      const contractRepository = new OracleContractRepository(oracle);
      const contractService = new ContractApplicationService(contractRepository);

      app.use(createContractsRouter({
        contractService,
        getCommonWhere,
        sanitizeContract: sanitizeContractDto,
        ensureCompanyMatchesDept
      }));
    }

    app.use(globalErrorHandler);
    return;
  }

  app.use(createImagesRouter({
    prisma,
    oracle,
    provider,
    serveEntityImage
  }));

  app.use(createInitiativesRouter({
    prisma,
    oracle,
    provider,
    buildCacheKey,
    getCachedState,
    isRefreshing,
    markRefreshing,
    singleflight,
    setCached,
    invalidateCacheByPrefix,
    serveSWR,
    normalizeMilestoneOrder,
    normalizeTaskOrder,
    getCommonWhere
  }));

  app.use(createSystemsRouter({
    prisma,
    oracle,
    provider,
    buildCacheKey,
    serveSWR,
    setCached,
    invalidateCacheByPrefix,
    getCommonWhere,
    sanitizeSystem: sanitizeSystemDto,
    ensureCompanyMatchesDept,
    systemListOmit
  }));

  const organizationRepository = new PrismaOrganizationRepository(prisma);
  const organizationService = new OrganizationApplicationService(organizationRepository);
  const companyRepository = new PrismaCompanyRepository(prisma);
  const companyService = new CompanyApplicationService(companyRepository);
  const departmentRepository = new PrismaDepartmentRepository(prisma);
  const departmentService = new DepartmentApplicationService(departmentRepository);
  const contractRepository = new PrismaContractRepository(prisma);
  const contractService = new ContractApplicationService(contractRepository);
  const skillRepository = new PrismaSkillRepository(prisma);
  const skillService = new SkillApplicationService(skillRepository);
  const vendorRepository = new PrismaVendorRepository(prisma);
  const vendorService = new VendorApplicationService(vendorRepository);

  app.use(createOrganizationRouter({
    organizationService,
    buildCacheKey,
    getCachedState,
    isRefreshing,
    markRefreshing,
    singleflight,
    setCached,
    invalidateCacheByPrefix,
    invalidateImageCacheByPrefix,
    serveSWR,
    getCommonWhere,
    sanitizeTeam: sanitizeOrganizationTeamDto,
    sanitizeCollaborator: sanitizeOrganizationCollaboratorDto,
    ensureCompanyMatchesDept,
    optimizeFieldInPlace,
    transformCollaboratorImage,
    collaboratorSafeSelect,
    collaboratorDashboardSelect
  }));

  app.use(createVendorsRouter({
    vendorService,
    buildCacheKey,
    serveSWR,
    setCached,
    getCommonWhere,
    sanitizeVendor: sanitizeVendorDto,
    ensureCompanyMatchesDept,
    optimizeFieldInPlace,
    invalidateImageCacheByPrefix,
    transformVendorImage,
    transformCollaboratorImage,
    transformCompanyImage,
    collaboratorSafeSelect,
    vendorListOmit,
    systemListOmit,
    companyListOmit,
    vendorLiteSelect
  }));

  app.use(createContractsRouter({
    contractService,
    getCommonWhere,
    sanitizeContract: sanitizeContractDto,
    ensureCompanyMatchesDept
  }));

  app.use(createAllocationsRouter({
    prisma,
    oracle,
    provider
  }));

  app.use(createDepartmentsRouter({
    departmentService,
    buildCacheKey,
    serveSWR,
    setCached,
    invalidateCacheByPrefix
  }));

  app.use(createCompaniesRouter({
    companyService,
    buildCacheKey,
    serveSWR,
    setCached,
    invalidateCacheByPrefix,
    invalidateImageCacheByPrefix,
    optimizeFieldInPlace,
    sanitizeCompany: sanitizeCompanyDto,
    transformCompanyImage,
    companyListOmit
  }));

  app.use(createInventoryRouter({
    prisma,
    oracle,
    provider,
    buildCacheKey,
    serveSWR,
    setCached,
    getCommonWhere,
    systemListOmit,
    vendorListOmit,
    collaboratorSafeSelect,
    transformCollaboratorImage,
    transformVendorImage
  }));

  app.use(createSkillsRouter({
    skillService,
    optimizeFieldInPlace,
    invalidateImageCacheByPrefix,
    transformSkillImage,
    transformCollaboratorImage,
    sanitizeSkill: sanitizeSkillDto
  }));

  app.use(createAbsencesRouter({
    prisma,
    oracle,
    provider
  }));

  app.use(createHolidaysRouter({
    prisma,
    oracle,
    provider
  }));

  app.use(globalErrorHandler);
}
