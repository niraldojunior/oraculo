import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';
import { PrismaBusinessUnitRepository } from '../../infrastructure/persistence/prisma/PrismaBusinessUnitRepository.js';
import { PrismaClientTeamRepository } from '../../infrastructure/persistence/prisma/PrismaClientTeamRepository.js';
import { createTestPrismaClient, truncateAll } from './bootstrap.js';

describe('Prisma BusinessUnit + ClientTeam against a real Postgres (integration)', () => {
  let prisma: PrismaClient;
  let businessUnitRepo: PrismaBusinessUnitRepository;
  let clientTeamRepo: PrismaClientTeamRepository;
  let companyId: string;
  let departmentId: string;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
    businessUnitRepo = new PrismaBusinessUnitRepository(prisma);
    clientTeamRepo = new PrismaClientTeamRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await truncateAll(prisma);
  });

  async function seedCompanyAndDepartment(): Promise<void> {
    const company = await prisma.company.create({
      data: { fantasyName: 'Acme', realName: 'Acme Inc', logo: '', description: '' }
    });
    const department = await prisma.department.create({
      data: { name: 'Engenharia', companyId: company.id }
    });
    companyId = company.id;
    departmentId = department.id;
  }

  it('rejects creating a business unit with a companyId that does not exist (real FK constraint)', async () => {
    await expect(
      businessUnitRepo.createBusinessUnit({ name: 'X', companyId: 'missing-company', departmentId: 'missing-department' })
    ).rejects.toThrow();
  });

  it('creates a business unit and a client team wired to it, resolving businessUnitName via real JOIN', async () => {
    await seedCompanyAndDepartment();

    const bu = await businessUnitRepo.createBusinessUnit({ name: 'Atacado & B2B', companyId, departmentId });
    expect(bu.id).toBeTruthy();

    const ct = await clientTeamRepo.createClientTeam({ name: 'Operações', companyId, departmentId, businessUnitId: bu.id });
    expect(ct.businessUnitId).toBe(bu.id);

    const listed = await clientTeamRepo.listClientTeams({ companyId });
    expect(listed).toContainEqual(
      expect.objectContaining({ id: ct.id, businessUnitId: bu.id, businessUnitName: 'Atacado & B2B' })
    );
  });

  it('nullifies clientTeam.businessUnitId when the business unit is deleted (real cascade)', async () => {
    await seedCompanyAndDepartment();

    const bu = await businessUnitRepo.createBusinessUnit({ name: 'FTTH', companyId, departmentId });
    const ct = await clientTeamRepo.createClientTeam({ name: 'Comercial', companyId, departmentId, businessUnitId: bu.id });

    await businessUnitRepo.deleteBusinessUnit(bu.id);

    const afterDelete = await clientTeamRepo.listClientTeams({ companyId });
    expect(afterDelete).toContainEqual(expect.objectContaining({ id: ct.id, businessUnitId: null, businessUnitName: null }));
  });

  it('filters by companyId and departmentId using the real WHERE clause', async () => {
    await seedCompanyAndDepartment();
    await businessUnitRepo.createBusinessUnit({ name: 'A', companyId, departmentId });

    const otherCompany = await prisma.company.create({ data: { fantasyName: 'Other', realName: 'Other Inc', logo: '', description: '' } });
    const otherDepartment = await prisma.department.create({ data: { name: 'Vendas', companyId: otherCompany.id } });
    await businessUnitRepo.createBusinessUnit({ name: 'B', companyId: otherCompany.id, departmentId: otherDepartment.id });

    const byCompany = await businessUnitRepo.listBusinessUnits({ companyId });
    expect(byCompany).toHaveLength(1);
    expect(byCompany[0]?.name).toBe('A');
  });
});
