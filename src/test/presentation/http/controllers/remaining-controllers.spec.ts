import { describe, expect, it, jest } from '@jest/globals';
import { AbsenceController } from '../../../../presentation/http/controllers/absence.controller.js';
import { AllocationController } from '../../../../presentation/http/controllers/allocation.controller.js';
import { CompanyController } from '../../../../presentation/http/controllers/company.controller.js';
import { ContractController } from '../../../../presentation/http/controllers/contract.controller.js';
import { CoreController } from '../../../../presentation/http/controllers/core.controller.js';
import { DepartmentController } from '../../../../presentation/http/controllers/department.controller.js';
import { HolidayController } from '../../../../presentation/http/controllers/holiday.controller.js';
import { InitiativeController } from '../../../../presentation/http/controllers/initiative.controller.js';
import { OrganizationController } from '../../../../presentation/http/controllers/organization.controller.js';
import { SkillController } from '../../../../presentation/http/controllers/skill.controller.js';
import { BusinessUnitController } from '../../../../presentation/http/controllers/business-unit.controller.js';
import { ClientTeamController } from '../../../../presentation/http/controllers/client-team.controller.js';
import { VendorController } from '../../../../presentation/http/controllers/vendor.controller.js';
import { VendorContextController } from '../../../../presentation/http/controllers/vendor-context.controller.js';
import { ImageController } from '../../../../presentation/http/controllers/image.controller.js';

// ─── AbsenceController ────────────────────────────────────────────────────────

describe('AbsenceController', () => {
  const mockAbsence = { id: 'a1', collaboratorId: 'u1', startDate: '2026-01-01', endDate: '2026-01-05', type: 'Férias', reason: null };
  const svc = { listAbsences: jest.fn(async () => [mockAbsence]), createAbsence: jest.fn(async () => mockAbsence), deleteAbsence: jest.fn(async () => undefined) };
  const ctrl = new AbsenceController(svc as any);

  it('list delegates to service', async () => {
    await ctrl.list({ companyId: 'c1' } as any);
    expect((svc.listAbsences as any).mock.calls[0][0]).toMatchObject({ companyId: 'c1' });
  });
  it('create delegates to service', async () => {
    const r = await ctrl.create({ collaboratorId: 'u1', startDate: '2026-01-01', endDate: '2026-01-05', type: 'Férias' } as any);
    expect(r.id).toBe('a1');
  });
  it('delete returns message', async () => {
    const r = await ctrl.delete('a1');
    expect(r).toEqual({ message: 'Absence deleted' });
  });
});

// ─── AllocationController ─────────────────────────────────────────────────────

describe('AllocationController', () => {
  const svc = { listAllocations: jest.fn(async () => []) };
  const ctrl = new AllocationController(svc as any);

  it('list delegates to service', async () => {
    const r = await ctrl.list();
    expect(svc.listAllocations).toHaveBeenCalled();
    expect(r).toEqual([]);
  });
});

// ─── CompanyController ────────────────────────────────────────────────────────

describe('CompanyController', () => {
  const company = { id: 'c1', fantasyName: 'A', realName: 'A Inc' };
  const svc = { listCompanies: jest.fn(async () => [company]), createCompany: jest.fn(async () => company), updateCompany: jest.fn(async () => company), deleteCompany: jest.fn(async () => undefined) };
  const ctrl = new CompanyController(svc as any);

  it('list, create, update, delete', async () => {
    expect(await ctrl.list()).toHaveLength(1);
    expect((await ctrl.create({} as any)).id).toBe('c1');
    expect((await ctrl.update('c1', {} as any)).id).toBe('c1');
    expect(await ctrl.delete('c1')).toEqual({ message: 'Company deleted' });
  });
});

// ─── ContractController ───────────────────────────────────────────────────────

describe('ContractController', () => {
  const contract = { id: 'k1' };
  const svc = { listContracts: jest.fn(async () => [contract]), createContract: jest.fn(async () => contract), updateContract: jest.fn(async () => contract), deleteContract: jest.fn(async () => undefined) };
  const ctrl = new ContractController(svc as any);

  it('list with scope', async () => {
    await ctrl.list('c1', 'd1');
    expect((svc.listContracts as any).mock.calls[0][0]).toEqual({ companyId: 'c1', departmentId: 'd1' });
  });
  it('create, update, delete', async () => {
    expect((await ctrl.create({} as any)).id).toBe('k1');
    expect((await ctrl.update('k1', {} as any)).id).toBe('k1');
    expect(await ctrl.delete('k1')).toEqual({ message: 'Contract deleted' });
  });
});

// ─── CoreController ───────────────────────────────────────────────────────────

describe('CoreController', () => {
  const svc = { login: jest.fn(async () => ({ id: 'u1', isAdmin: false, type: 'collaborator' })) };
  const ctrl = new CoreController(svc as any);

  it('health returns ok', () => {
    expect(ctrl.health().status).toBe('OK');
  });
  it('login delegates to service', async () => {
    const r = await ctrl.login({ email: 'u@c.com', password: '123' });
    expect((r as any).id).toBe('u1');
  });
});

// ─── DepartmentController ─────────────────────────────────────────────────────

describe('DepartmentController', () => {
  const dept = { id: 'd1', name: 'Eng', companyId: 'c1' };
  const svc = { listDepartments: jest.fn(async () => [dept]), updateDepartmentBasic: jest.fn(async () => dept), createDepartmentWithMaster: jest.fn(async () => dept), updateDepartmentWithMaster: jest.fn(async () => dept) };
  const ctrl = new DepartmentController(svc as any);

  it('list', async () => expect(await ctrl.list()).toHaveLength(1));
  it('updateBasic strips masterUser', async () => {
    await ctrl.updateBasic('d1', { name: 'Eng', companyId: 'c1', masterUserId: 'u1' } as any);
    const arg = (svc.updateDepartmentBasic as jest.Mock).mock.calls[0][1] as any;
    expect(arg).not.toHaveProperty('masterUserId');
  });
  it('create and updateWithMaster', async () => {
    expect((await ctrl.create({ name: 'Eng', companyId: 'c1' } as any)).id).toBe('d1');
    expect((await ctrl.updateWithMaster('d1', { name: 'Eng', companyId: 'c1' } as any)).id).toBe('d1');
  });
});

// ─── HolidayController ────────────────────────────────────────────────────────

describe('HolidayController', () => {
  const holiday = { id: 'h1', date: '2026-01-01', name: 'Ano Novo', companyId: null };
  const svc = { listHolidays: jest.fn(async () => [holiday]), createHoliday: jest.fn(async () => holiday), deleteHoliday: jest.fn(async () => undefined) };
  const ctrl = new HolidayController(svc as any);

  it('list, create, delete', async () => {
    await ctrl.list({ companyId: 'c1' } as any);
    expect((svc.listHolidays as any).mock.calls[0][0]).toBe('c1');
    expect((await ctrl.create({ date: '2026-01-01', name: 'X' } as any)).id).toBe('h1');
    expect(await ctrl.delete('h1')).toEqual({ message: 'Holiday deleted' });
  });
});

// ─── InitiativeController ─────────────────────────────────────────────────────

describe('InitiativeController', () => {
  const init = { id: 'i1', title: 'T', status: 'Backlog', priority: 1, createdAt: new Date() };
  const svc = {
    listByScope: jest.fn(async () => [init]),
    getById: jest.fn(async () => init),
    getHistory: jest.fn(async () => []),
    create: jest.fn(async () => init),
    update: jest.fn(async () => init),
    delete: jest.fn(async () => undefined),
    reprioritize: jest.fn(async () => init)
  };
  const ctrl = new InitiativeController(svc as any);

  it('list delegates scope', async () => {
    await ctrl.list('c1', 'd1');
    expect((svc.listByScope as any).mock.calls[0][0]).toEqual({ companyId: 'c1', departmentId: 'd1' });
  });
  it('getById, getHistory, create, reprioritize', async () => {
    expect((await ctrl.getById('i1')).id).toBe('i1');
    expect(await ctrl.getHistory('i1')).toHaveLength(0);
    expect((await ctrl.create({ title: 'New' } as any)).id).toBe('i1');
    expect((await ctrl.update('i1', { title: 'Updated' } as any)).id).toBe('i1');
    expect((await ctrl.reprioritize('i1', { priority: 5 })).id).toBe('i1');
  });
  it('delete delegates to service and returns message', async () => {
    const r = await ctrl.delete('i1');
    expect((svc.delete as any).mock.calls[0][0]).toBe('i1');
    expect(r).toEqual({ message: 'Initiative deleted' });
  });
});

// ─── OrganizationController ───────────────────────────────────────────────────

describe('OrganizationController', () => {
  const team = { id: 't1', name: 'Alpha' };
  const collab = { id: 'u1', name: 'Ana', email: 'ana@corp.com', role: 'Engineer' };
  const svc = {
    listTeamsByScope: jest.fn(async () => [team]),
    createTeam: jest.fn(async () => team),
    updateTeam: jest.fn(async () => team),
    deleteTeam: jest.fn(async () => undefined),
    listCollaboratorsByScope: jest.fn(async () => [collab]),
    findCollaboratorByEmail: jest.fn(async () => collab),
    createCollaborator: jest.fn(async () => collab),
    updateCollaborator: jest.fn(async () => collab),
    deleteCollaborator: jest.fn(async () => undefined),
    toggleCollaboratorSkill: jest.fn(async () => undefined)
  };
  const ctrl = new OrganizationController(svc as any);

  it('team methods', async () => {
    expect(await ctrl.listTeams('c1')).toHaveLength(1);
    expect((await ctrl.createTeam({} as any)).id).toBe('t1');
    expect((await ctrl.updateTeam('t1', {} as any)).id).toBe('t1');
    expect(await ctrl.deleteTeam('t1')).toEqual({ message: 'Team deleted' });
  });
  it('collaborator methods', async () => {
    expect(await ctrl.listCollaborators('c1')).toHaveLength(1);
    expect((await ctrl.getByEmail('ana@corp.com'))?.id).toBe('u1');
    expect((await ctrl.createCollaborator({} as any)).id).toBe('u1');
    expect((await ctrl.updateCollaborator('u1', {} as any)).id).toBe('u1');
    expect(await ctrl.deleteCollaborator('u1')).toEqual({ message: 'Collaborator deleted' });
    expect(await ctrl.toggleCollaboratorSkill({ collaboratorId: 'u1', skillId: 's1', active: true })).toEqual({ success: true });
  });
});

// ─── SkillController ──────────────────────────────────────────────────────────

describe('SkillController', () => {
  const skill = { id: 's1', name: 'TS' };
  const svc = { listSkills: jest.fn(async () => [skill]), createSkill: jest.fn(async () => skill), updateSkill: jest.fn(async () => skill), deleteSkill: jest.fn(async () => undefined) };
  const ctrl = new SkillController(svc as any);

  it('list, create, update, delete', async () => {
    expect(await ctrl.list('c1')).toHaveLength(1);
    expect((await ctrl.create({ name: 'TS', memberIds: ['u1'] } as any)).id).toBe('s1');
    expect((await ctrl.update('s1', { name: 'TS2' } as any)).id).toBe('s1');
    expect(await ctrl.delete('s1')).toEqual({ success: true });
  });
});

// ─── BusinessUnitController ───────────────────────────────────────────────────

describe('BusinessUnitController', () => {
  const bu = { id: 'b1', name: 'Atacado & B2B', companyId: 'c1', departmentId: 'd1' };
  const svc = { listBusinessUnits: jest.fn(async () => [bu]), createBusinessUnit: jest.fn(async () => bu), updateBusinessUnit: jest.fn(async () => bu), deleteBusinessUnit: jest.fn(async () => undefined) };
  const ctrl = new BusinessUnitController(svc as any);

  it('list, create, update, delete', async () => {
    await ctrl.list('c1', 'd1');
    expect((svc.listBusinessUnits as any).mock.calls[0][0]).toEqual({ companyId: 'c1', departmentId: 'd1' });
    expect((await ctrl.create({ name: 'FTTH', companyId: 'c1', departmentId: 'd1' } as any)).id).toBe('b1');
    expect((await ctrl.update('b1', { name: 'FTTH' } as any)).id).toBe('b1');
    expect(await ctrl.delete('b1')).toEqual({ success: true });
  });
});

// ─── ClientTeamController ─────────────────────────────────────────────────────

describe('ClientTeamController', () => {
  const ct = { id: 'ct1', name: 'Operações', companyId: 'c1', departmentId: 'd1', businessUnitId: 'b1', businessUnitName: 'Atacado & B2B' };
  const svc = { listClientTeams: jest.fn(async () => [ct]), createClientTeam: jest.fn(async () => ct), updateClientTeam: jest.fn(async () => ct), deleteClientTeam: jest.fn(async () => undefined) };
  const ctrl = new ClientTeamController(svc as any);

  it('list, create, update, delete', async () => {
    await ctrl.list('c1', 'd1');
    expect((svc.listClientTeams as any).mock.calls[0][0]).toEqual({ companyId: 'c1', departmentId: 'd1' });
    expect((await ctrl.create({ name: 'Comercial', companyId: 'c1', departmentId: 'd1', businessUnitId: 'b1' } as any)).id).toBe('ct1');
    expect((await ctrl.update('ct1', { businessUnitId: null } as any)).id).toBe('ct1');
    expect(await ctrl.delete('ct1')).toEqual({ success: true });
  });
});

// ─── VendorController ─────────────────────────────────────────────────────────

describe('VendorController', () => {
  const vendor = { id: 'v1', companyName: 'Corp' };
  const ctx = { vendors: [vendor], contracts: [], systems: [], collaborators: [], companies: [], departments: [] };
  const svc = { listVendors: jest.fn(async () => [vendor]), getVendorsContext: jest.fn(async () => ctx), createVendor: jest.fn(async () => vendor), updateVendor: jest.fn(async () => vendor), deleteVendor: jest.fn(async () => undefined) };
  const ctrl = new VendorController(svc as any);

  it('all methods', async () => {
    expect(await ctrl.list('c1')).toHaveLength(1);
    expect((await ctrl.context('c1')).vendors).toHaveLength(1);
    expect((await ctrl.create({} as any)).id).toBe('v1');
    expect((await ctrl.update('v1', {} as any)).id).toBe('v1');
    expect(await ctrl.delete('v1')).toEqual({ message: 'Vendor deleted' });
  });
});

// ─── VendorContextController ──────────────────────────────────────────────────

describe('VendorContextController', () => {
  const ctx = { vendors: [], contracts: [], systems: [], collaborators: [], companies: [], departments: [] };
  const svc = { getVendorsContext: jest.fn(async () => ctx) };
  const ctrl = new VendorContextController(svc as any);

  it('context delegates to service', async () => {
    const r = await ctrl.context('c1', 'd1');
    expect((svc.getVendorsContext as any).mock.calls[0][0]).toEqual({ companyId: 'c1', departmentId: 'd1' });
    expect(r.vendors).toHaveLength(0);
  });
});

// ─── ImageController ──────────────────────────────────────────────────────────

describe('ImageController', () => {
  const imgSvc = {
    serveCollaboratorImage: jest.fn(async () => undefined),
    serveCompanyImage: jest.fn(async () => undefined),
    serveVendorImage: jest.fn(async () => undefined),
    serveSkillImage: jest.fn(async () => undefined)
  };
  const ctrl = new ImageController(imgSvc as any);
  const req: any = { headers: {} };
  const res: any = { status: jest.fn(() => res), end: jest.fn(), send: jest.fn() };

  it('delegates all image routes', async () => {
    await ctrl.collaborator(req, res, 'u1');
    expect((imgSvc.serveCollaboratorImage as any).mock.calls[0]).toEqual([req, res, 'u1']);

    await ctrl.company(req, res, 'c1');
    expect((imgSvc.serveCompanyImage as any).mock.calls[0]).toEqual([req, res, 'c1']);

    await ctrl.vendor(req, res, 'v1');
    expect((imgSvc.serveVendorImage as any).mock.calls[0]).toEqual([req, res, 'v1']);

    await ctrl.skill(req, res, 's1');
    expect((imgSvc.serveSkillImage as any).mock.calls[0]).toEqual([req, res, 's1']);
  });
});
