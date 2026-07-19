import { describe, expect, it } from '@jest/globals';
import { InMemoryInitiativeRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryInitiativeRepository.js';
import { InMemorySystemRepository } from '../../../../infrastructure/persistence/inmemory/InMemorySystemRepository.js';
import { InMemoryCompanyRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryCompanyRepository.js';
import { InMemoryOrganizationRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryOrganizationRepository.js';
import { InMemoryVendorRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryVendorRepository.js';
import { InMemoryContractRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryContractRepository.js';
import { InMemorySkillRepository } from '../../../../infrastructure/persistence/inmemory/InMemorySkillRepository.js';
import { InMemoryAuthRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryAuthRepository.js';
import { InMemoryInventoryRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryInventoryRepository.js';
import { InMemoryAbsenceRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryAbsenceRepository.js';
import { InMemoryAllocationRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryAllocationRepository.js';
import { InMemoryHolidayRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryHolidayRepository.js';
import { InMemoryDepartmentRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryDepartmentRepository.js';
import { InMemoryClientTeamRepository } from '../../../../infrastructure/persistence/inmemory/InMemoryClientTeamRepository.js';

// ─── InMemoryInitiativeRepository ──────────────────────────────────────────

describe('InMemoryInitiativeRepository', () => {
  it('creates and retrieves an initiative', async () => {
    const repo = new InMemoryInitiativeRepository();
    const created = await repo.create({
      title: 'T1', companyId: 'c1', departmentId: 'd1',
      status: 'Backlog', priority: 1
    });
    expect(created.id).toBeDefined();
    const found = await repo.findById(created.id);
    expect(found?.title).toBe('T1');
  });

  it('returns null for unknown id', async () => {
    const repo = new InMemoryInitiativeRepository();
    expect(await repo.findById('none')).toBeNull();
  });

  it('listByScope filters by companyId and departmentId', async () => {
    const repo = new InMemoryInitiativeRepository();
    await repo.create({ title: 'A', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 0 });
    await repo.create({ title: 'B', companyId: 'c2', departmentId: 'd1', status: 'Backlog', priority: 0 });
    await repo.create({ title: 'C', companyId: 'c1', departmentId: 'd2', status: 'Backlog', priority: 0 });

    const byCompany = await repo.listByScope({ companyId: 'c1' });
    expect(byCompany).toHaveLength(2);

    const byBoth = await repo.listByScope({ companyId: 'c1', departmentId: 'd1' });
    expect(byBoth).toHaveLength(1);

    const all = await repo.listByScope({});
    expect(all).toHaveLength(3);
  });

  it('saves (upserts) an existing initiative', async () => {
    const repo = new InMemoryInitiativeRepository();
    const created = await repo.create({ title: 'Old', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 0 });
    await repo.save({ ...created, title: 'New' });
    const updated = await repo.findById(created.id);
    expect(updated?.title).toBe('New');
  });

  it('deletes an initiative', async () => {
    const repo = new InMemoryInitiativeRepository();
    const created = await repo.create({ title: 'ToRemove', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 0 });
    await repo.delete(created.id);
    expect(await repo.findById(created.id)).toBeNull();
  });

  it('counts links and derives the current client team name', async () => {
    const teams = new InMemoryClientTeamRepository();
    const team = await teams.createClientTeam({ name: 'Nome antigo', companyId: 'c1', departmentId: 'd1' });
    const repo = new InMemoryInitiativeRepository(teams);
    const initiative = await repo.create({
      title: 'T', companyId: 'c1', departmentId: 'd1', status: 'Backlog', priority: 0,
      clientTeamId: team.id
    });

    expect(await repo.countByClientTeamId(team.id)).toBe(1);
    await teams.updateClientTeam(team.id, { name: 'Nome novo' });
    expect((await repo.findById(initiative.id))?.originDirectorate).toBe('Nome novo');
  });
});

// ─── InMemorySystemRepository ───────────────────────────────────────────────

describe('InMemorySystemRepository', () => {
  it('creates, finds and lists systems', async () => {
    const repo = new InMemorySystemRepository();
    const s = await repo.createSystem({ companyId: 'c1', departmentId: 'd1', name: 'ERP', criticality: 'Tier 2', lifecycleStatus: 'Ativo Greenfield', debtScore: 0 });
    expect(await repo.findSystemById(s.id)).not.toBeNull();

    const all = await repo.listSystems({ companyId: 'c1' });
    expect(all).toHaveLength(1);

    const empty = await repo.listSystems({ companyId: 'other' });
    expect(empty).toHaveLength(0);
  });

  it('returns null for unknown id', async () => {
    expect(await new InMemorySystemRepository().findSystemById('x')).toBeNull();
  });

  it('filters by departmentId and defaults missing fields on create', async () => {
    const repo = new InMemorySystemRepository();
    await repo.createSystem({ companyId: 'c1', departmentId: 'd1', name: 'A', criticality: 'Tier 3', lifecycleStatus: 'Planejado', debtScore: 0 });
    await repo.createSystem({ companyId: 'c1', departmentId: 'd2', name: 'B', criticality: 'Tier 3', lifecycleStatus: 'Planejado', debtScore: 0 });

    const byDept = await repo.listSystems({ departmentId: 'd1' });
    expect(byDept).toHaveLength(1);

    const created = await repo.createSystem({});
    expect(created.category).toBeNull();
    expect(created.ownerTeamId).toBeNull();
    expect(created.description).toBe('');
  });

  it('updates system', async () => {
    const repo = new InMemorySystemRepository();
    const s = await repo.createSystem({ companyId: 'c1', departmentId: 'd1', name: 'v1', criticality: 'Tier 3', lifecycleStatus: 'Planejado', debtScore: 0 });
    const updated = await repo.updateSystem(s.id, { ...s, name: 'v2' });
    expect(updated.name).toBe('v2');
  });

  it('throws on update of unknown system', async () => {
    await expect(new InMemorySystemRepository().updateSystem('x', {} as any)).rejects.toThrow('System not found');
  });

  it('deletes system', async () => {
    const repo = new InMemorySystemRepository();
    const s = await repo.createSystem({ companyId: 'c1', departmentId: 'd1', name: 'x', criticality: 'Tier 3', lifecycleStatus: 'Planejado', debtScore: 0 });
    await repo.deleteSystem(s.id);
    expect(await repo.findSystemById(s.id)).toBeNull();
  });
});

// ─── InMemoryCompanyRepository ──────────────────────────────────────────────

describe('InMemoryCompanyRepository', () => {
  it('creates, lists, updates and deletes companies', async () => {
    const repo = new InMemoryCompanyRepository();
    const c = await repo.createCompany({ fantasyName: 'A', realName: 'A Inc' });
    expect(c.id).toBeDefined();

    const list = await repo.listCompanies();
    expect(list).toHaveLength(1);

    const updated = await repo.updateCompany(c.id, { fantasyName: 'B', realName: 'B Inc' });
    expect(updated.fantasyName).toBe('B');

    await repo.deleteCompany(c.id);
    expect(await repo.listCompanies()).toHaveLength(0);
  });

  it('throws on update of unknown company', async () => {
    await expect(new InMemoryCompanyRepository().updateCompany('x', {} as any)).rejects.toThrow('Company not found');
  });

  it('defaults missing fields on create', async () => {
    const created = await new InMemoryCompanyRepository().createCompany({});
    expect(created.fantasyName).toBe('');
    expect(created.realName).toBe('');
  });
});

// ─── InMemoryOrganizationRepository ────────────────────────────────────────

describe('InMemoryOrganizationRepository', () => {
  it('manages teams lifecycle', async () => {
    const repo = new InMemoryOrganizationRepository();
    const t = await repo.createTeam({ companyId: 'c1', departmentId: 'd1', name: 'Alpha', type: 'SQUAD' });
    expect(t.id).toBeDefined();

    const list = await repo.listTeamsByScope({ companyId: 'c1' });
    expect(list).toHaveLength(1);

    const updated = await repo.updateTeam(t.id, { ...t, name: 'Beta' });
    expect(updated.name).toBe('Beta');

    await repo.deleteTeam(t.id);
    expect(await repo.listTeamsByScope({})).toHaveLength(0);
  });

  it('throws on updateTeam of unknown id', async () => {
    await expect(new InMemoryOrganizationRepository().updateTeam('x', {} as any)).rejects.toThrow('Team not found');
  });

  it('listTeamsByScope filters by departmentId and defaults missing fields on create', async () => {
    const repo = new InMemoryOrganizationRepository();
    await repo.createTeam({ companyId: 'c1', departmentId: 'd1', name: 'A', type: 'SQUAD' });
    await repo.createTeam({ companyId: 'c1', departmentId: 'd2', name: 'B', type: 'SQUAD' });
    await repo.createTeam({ companyId: 'c2', departmentId: 'd1', name: 'C', type: 'SQUAD' });

    const byDept = await repo.listTeamsByScope({ departmentId: 'd1' });
    expect(byDept).toHaveLength(2);

    const byCompany = await repo.listTeamsByScope({ companyId: 'c1' });
    expect(byCompany).toHaveLength(2);

    const created = await repo.createTeam({});
    expect(created.name).toBe('');
    expect(created.parentTeamId).toBeNull();
    expect(created.leaderId).toBeNull();
    expect(created.receivesInitiatives).toBe(false);
  });

  it('manages collaborators lifecycle', async () => {
    const repo = new InMemoryOrganizationRepository();
    const c = await repo.createCollaborator({ companyId: 'c1', departmentId: 'd1', name: 'Ana', email: 'ana@corp.com', role: 'Engineer' });
    expect(c.id).toBeDefined();

    expect(await repo.findCollaboratorById(c.id)).not.toBeNull();
    expect(await repo.findCollaboratorByEmail('ANA@corp.com')).not.toBeNull();
    expect(await repo.findCollaboratorByEmail('unknown@x.com')).toBeNull();

    const updated = await repo.updateCollaborator(c.id, { ...c, name: 'Ana P' });
    expect(updated.name).toBe('Ana P');

    await repo.deleteCollaborator(c.id);
    expect(await repo.findCollaboratorById(c.id)).toBeNull();
  });

  it('throws on updateCollaborator of unknown id', async () => {
    await expect(new InMemoryOrganizationRepository().updateCollaborator('x', {} as any)).rejects.toThrow('Collaborator not found');
  });

  it('listCollaboratorsByScope filters by scope', async () => {
    const repo = new InMemoryOrganizationRepository();
    await repo.createCollaborator({ companyId: 'c1', departmentId: 'd1', name: 'A', email: 'a@c.com', role: 'Engineer' });
    await repo.createCollaborator({ companyId: 'c2', departmentId: 'd1', name: 'B', email: 'b@c.com', role: 'Engineer' });
    await repo.createCollaborator({ companyId: 'c1', departmentId: 'd2', name: 'C', email: 'c@c.com', role: 'Engineer' });

    const c1 = await repo.listCollaboratorsByScope({ scope: { companyId: 'c1' }, lite: false });
    expect(c1).toHaveLength(2);

    const byDept = await repo.listCollaboratorsByScope({ scope: { departmentId: 'd1' }, lite: false });
    expect(byDept).toHaveLength(2);
  });

  it('defaults missing fields on createCollaborator', async () => {
    const created = await new InMemoryOrganizationRepository().createCollaborator({});
    expect(created.name).toBe('');
    expect(created.email).toBe('');
    expect(created.role).toBe('');
    expect(created.isAdmin).toBe(false);
    expect(created.associatedCompanyIds).toEqual([]);
  });

  it('toggleCollaboratorSkill adds and removes', async () => {
    const repo = new InMemoryOrganizationRepository();
    await repo.toggleCollaboratorSkill({ collaboratorId: 'u1', skillId: 's1', active: true });
    await repo.toggleCollaboratorSkill({ collaboratorId: 'u1', skillId: 's1', active: false });
    // no throw is the assertion
  });
});

// ─── InMemoryVendorRepository ───────────────────────────────────────────────

describe('InMemoryVendorRepository', () => {
  it('CRUD + getVendorsContext', async () => {
    const repo = new InMemoryVendorRepository();
    const v = await repo.createVendor({ companyId: 'c1', departmentId: 'd1', companyName: 'V1', taxId: '1', type: 'Parceiro' });
    expect(v.id).toBeDefined();

    const list = await repo.listVendors({ companyId: 'c1' });
    expect(list).toHaveLength(1);

    const ctx = await repo.getVendorsContext({ companyId: 'c1' });
    expect(ctx.vendors).toHaveLength(1);

    const u = await repo.updateVendor(v.id, { ...v, companyName: 'V2' });
    expect(u.companyName).toBe('V2');

    await repo.deleteVendor(v.id);
    expect(await repo.listVendors({})).toHaveLength(0);
  });

  it('throws on update of unknown vendor', async () => {
    await expect(new InMemoryVendorRepository().updateVendor('x', {} as any)).rejects.toThrow('Vendor not found');
  });

  it('listVendors filters by scope', async () => {
    const repo = new InMemoryVendorRepository();
    await repo.createVendor({ companyId: 'c1', departmentId: 'd1', companyName: 'V1', taxId: '1', type: 'P' });
    await repo.createVendor({ companyId: 'c2', departmentId: 'd1', companyName: 'V2', taxId: '2', type: 'P' });
    await repo.createVendor({ companyId: 'c1', departmentId: 'd2', companyName: 'V3', taxId: '3', type: 'P' });
    expect(await repo.listVendors({ companyId: 'c1' })).toHaveLength(2);
    expect(await repo.listVendors({ departmentId: 'd1' })).toHaveLength(2);
  });

  it('defaults missing fields on create', async () => {
    const created = await new InMemoryVendorRepository().createVendor({});
    expect(created.companyName).toBe('');
    expect(created.taxId).toBe('');
    expect(created.logoUrl).toBeNull();
    expect(created.directorId).toBeNull();
    expect(created.managerId).toBeNull();
  });
});

// ─── InMemoryContractRepository ─────────────────────────────────────────────

describe('InMemoryContractRepository', () => {
  it('CRUD with scope filter', async () => {
    const repo = new InMemoryContractRepository();
    const payload = { companyId: 'c1', departmentId: 'd1', vendorId: 'v1', number: 'CT1', startDate: '2026-01-01', endDate: '2026-12-31', model: 'Anual', annualCost: 10 };
    const c = await repo.createContract(payload);
    expect(c.id).toBeDefined();

    const list = await repo.listContracts({ companyId: 'c1' });
    expect(list).toHaveLength(1);

    const empty = await repo.listContracts({ companyId: 'other' });
    expect(empty).toHaveLength(0);

    const u = await repo.updateContract(c.id, { ...payload, number: 'CT2' });
    expect(u.number).toBe('CT2');

    await repo.deleteContract(c.id);
    expect(await repo.listContracts({})).toHaveLength(0);
  });

  it('throws on update of unknown contract', async () => {
    await expect(new InMemoryContractRepository().updateContract('x', {} as any)).rejects.toThrow('Contract not found');
  });

  it('filters by departmentId and defaults missing fields on create', async () => {
    const repo = new InMemoryContractRepository();
    await repo.createContract({ companyId: 'c1', departmentId: 'd1', vendorId: 'v1', number: 'CT1', startDate: '2026-01-01', endDate: '2026-12-31', model: 'Anual', annualCost: 10 });
    await repo.createContract({ companyId: 'c1', departmentId: 'd2', vendorId: 'v1', number: 'CT2', startDate: '2026-01-01', endDate: '2026-12-31', model: 'Anual', annualCost: 10 });

    const byDept = await repo.listContracts({ departmentId: 'd1' });
    expect(byDept).toHaveLength(1);

    const created = await repo.createContract({});
    expect(created.annualCost).toBe(0);
    expect(created.name).toBeNull();
    expect(created.description).toBeNull();
    expect(created.status).toBe('Ativo');
    expect(created.systemId).toBeNull();
    expect(created.leaderId).toBeNull();
  });
});

// ─── InMemorySkillRepository ────────────────────────────────────────────────

describe('InMemorySkillRepository', () => {
  it('creates skill with members and updates preserving members when no ids given', async () => {
    const repo = new InMemorySkillRepository();
    const s = await repo.createSkill({ name: 'TS', description: '', companyId: 'c1', departmentId: 'd1' }, ['u1', 'u2']);
    expect(s.collaborators).toHaveLength(2);

    const u = await repo.updateSkill(s.id, { ...s });
    expect(u.collaborators).toHaveLength(2);

    const u2 = await repo.updateSkill(s.id, { ...s }, ['u3']);
    expect(u2.collaborators).toHaveLength(1);
  });

  it('listSkills filters by scope', async () => {
    const repo = new InMemorySkillRepository();
    await repo.createSkill({ name: 'A', description: '', companyId: 'c1', departmentId: 'd1' });
    await repo.createSkill({ name: 'B', description: '', companyId: 'c2', departmentId: 'd1' });
    await repo.createSkill({ name: 'C', description: '', companyId: 'c1', departmentId: 'd2' });
    expect(await repo.listSkills({ companyId: 'c1' })).toHaveLength(2);
    expect(await repo.listSkills({ departmentId: 'd1' })).toHaveLength(2);
  });

  it('defaults missing fields on create', async () => {
    const created = await new InMemorySkillRepository().createSkill({});
    expect(created.name).toBe('');
    expect(created.description).toBe('');
    expect(created.familia).toBeNull();
    expect(created.icon).toBeNull();
    expect(created.companyId).toBe('');
    expect(created.departmentId).toBe('');
    expect(created.collaborators).toEqual([]);
  });

  it('throws on update of unknown skill', async () => {
    await expect(new InMemorySkillRepository().updateSkill('x', {} as any)).rejects.toThrow('Skill not found');
  });

  it('deletes skill', async () => {
    const repo = new InMemorySkillRepository();
    const s = await repo.createSkill({ name: 'X', description: '', companyId: 'c1', departmentId: 'd1' });
    await repo.deleteSkill(s.id);
    expect(await repo.listSkills({})).toHaveLength(0);
  });
});

// ─── InMemoryAuthRepository ─────────────────────────────────────────────────

describe('InMemoryAuthRepository', () => {
  it('always returns null', async () => {
    const repo = new InMemoryAuthRepository();
    expect(await repo.findCollaboratorByEmail('any@corp.com')).toBeNull();
  });
});

// ─── InMemoryInventoryRepository ────────────────────────────────────────────

describe('InMemoryInventoryRepository', () => {
  it('returns empty context for any scope', async () => {
    const repo = new InMemoryInventoryRepository();
    const ctx = await repo.getInventoryContext({ companyId: 'c1' });
    expect(ctx.systems).toHaveLength(0);
    expect(ctx.vendors).toHaveLength(0);
  });
});

// ─── InMemoryAbsenceRepository ───────────────────────────────────────────────

describe('InMemoryAbsenceRepository', () => {
  it('creates, lists and deletes absences', async () => {
    const repo = new InMemoryAbsenceRepository();
    const a = await repo.createAbsence({ collaboratorId: 'u1', startDate: '2026-01-01', endDate: '2026-01-05', type: 'Férias' });
    expect(a.id).toBeDefined();

    const list = await repo.listAbsences({ companyId: 'c1' });
    expect(list).toHaveLength(1);

    await repo.deleteAbsence(a.id);
    expect(await repo.listAbsences({})).toHaveLength(0);
  });

  it('defaults missing fields on create', async () => {
    const created = await new InMemoryAbsenceRepository().createAbsence({});
    expect(created.collaboratorId).toBe('');
    expect(created.startDate).toBe('');
    expect(created.endDate).toBe('');
    expect(created.type).toBe('');
    expect(created.reason).toBeNull();
  });
});

// ─── InMemoryAllocationRepository ───────────────────────────────────────────

describe('InMemoryAllocationRepository', () => {
  it('always returns empty list', async () => {
    const repo = new InMemoryAllocationRepository();
    expect(await repo.listAllocations()).toHaveLength(0);
  });
});

// ─── InMemoryHolidayRepository ───────────────────────────────────────────────

describe('InMemoryHolidayRepository', () => {
  it('creates, lists with filter and deletes holidays', async () => {
    const repo = new InMemoryHolidayRepository();
    const national = await repo.createHoliday({ date: '2026-01-01', name: 'Ano Novo', companyId: null });
    const company = await repo.createHoliday({ date: '2026-06-01', name: 'Aniversário', companyId: 'c1' });

    // national holiday (companyId null) appears when no filter
    const withoutFilter = await repo.listHolidays();
    expect(withoutFilter).toContainEqual(expect.objectContaining({ id: national.id }));

    // company holiday appears when filtering by that company; national too
    const withFilter = await repo.listHolidays('c1');
    expect(withFilter.some(h => h.id === company.id)).toBe(true);
    expect(withFilter.some(h => h.id === national.id)).toBe(true);

    // other company doesn't see company holiday
    const other = await repo.listHolidays('c2');
    expect(other.some(h => h.id === company.id)).toBe(false);

    await repo.deleteHoliday(national.id);
    expect(await repo.listHolidays()).toHaveLength(0);
  });

  it('defaults missing fields on create', async () => {
    const created = await new InMemoryHolidayRepository().createHoliday({});
    expect(created.date).toBe('');
    expect(created.name).toBe('');
  });
});

// ─── InMemoryDepartmentRepository ───────────────────────────────────────────

describe('InMemoryDepartmentRepository', () => {
  it('full lifecycle: create / list / updateBasic / updateWithMaster', async () => {
    const repo = new InMemoryDepartmentRepository();
    const d = await repo.createDepartmentWithMaster({ departmentData: { name: 'Eng', companyId: 'c1' }, masterUserId: 'u1' });
    expect(d.masterUserId).toBe('u1');

    const list = await repo.listDepartments();
    expect(list).toHaveLength(1);

    const basic = await repo.updateDepartmentBasic(d.id, { name: 'Eng 2', companyId: 'c1' });
    expect(basic.name).toBe('Eng 2');

    const withMaster = await repo.updateDepartmentWithMaster({ id: d.id, departmentData: { name: 'Eng 3', companyId: 'c1' }, masterUserId: 'u2' });
    expect(withMaster.masterUserId).toBe('u2');
    expect(withMaster.name).toBe('Eng 3');
  });

  it('throws on updateDepartmentBasic of unknown id', async () => {
    await expect(new InMemoryDepartmentRepository().updateDepartmentBasic('x', {} as any)).rejects.toThrow('Department not found');
  });

  it('throws on updateDepartmentWithMaster of unknown id', async () => {
    await expect(new InMemoryDepartmentRepository().updateDepartmentWithMaster({ id: 'x', departmentData: {} as any })).rejects.toThrow('Department not found');
  });

  it('defaults missing fields on createDepartmentWithMaster', async () => {
    const created = await new InMemoryDepartmentRepository().createDepartmentWithMaster({ departmentData: {} });
    expect(created.name).toBe('');
    expect(created.companyId).toBe('');
    expect(created.masterUserId).toBeNull();
  });

  it('keeps current masterUserId on updateDepartmentWithMaster when not provided', async () => {
    const repo = new InMemoryDepartmentRepository();
    const d = await repo.createDepartmentWithMaster({ departmentData: { name: 'Eng', companyId: 'c1' }, masterUserId: 'u1' });

    const updated = await repo.updateDepartmentWithMaster({ id: d.id, departmentData: { name: 'Eng 2', companyId: 'c1' } });
    expect(updated.masterUserId).toBe('u1');
  });
});
