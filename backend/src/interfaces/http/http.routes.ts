import type express from 'express';
import type { PrismaClient } from '@prisma/client';
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
  prisma: PrismaClient;
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
    prisma,
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

  app.use(createCoreRouter({ prisma }));

  app.use(createImagesRouter({
    prisma,
    serveEntityImage
  }));

  app.use(requestLoggingMiddleware);

  app.use(createInitiativesRouter({
    prisma,
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
    prisma
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
    prisma
  }));

  app.use(createHolidaysRouter({
    prisma
  }));

  app.use(globalErrorHandler);
}
