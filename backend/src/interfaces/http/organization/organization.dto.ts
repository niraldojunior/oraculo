const VALID_COLLABORATOR_FIELDS = new Set([
  'name',
  'email',
  'role',
  'squadId',
  'photoUrl',
  'phone',
  'bio',
  'linkedinUrl',
  'githubUrl',
  'companyId',
  'departmentId',
  'password',
  'isAdmin',
  'birthday',
  'vacationStart',
  'associatedCompanyIds',
  'startDate',
  'endDate',
  'uf'
]);

const VALID_TEAM_FIELDS = new Set([
  'name',
  'type',
  'parentTeamId',
  'leaderId',
  'companyId',
  'departmentId',
  'receivesInitiatives'
]);

function stripImageRefFields<T extends Record<string, any>>(data: T, fields: string[]): T {
  for (const field of fields) {
    const value = data[field];
    if (typeof value === 'string' && value.startsWith('/api/_img/')) {
      delete data[field];
    }
  }
  return data;
}

export function sanitizeOrganizationCollaboratorDto(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_COLLABORATOR_FIELDS.has(key)) clean[key] = data[key];
  }

  if (clean.squadId === '') clean.squadId = null;
  if (clean.departmentId === '') clean.departmentId = null;
  if (clean.companyId === '') clean.companyId = null;
  if (clean.vacationStart === '') clean.vacationStart = null;
  if (clean.startDate === '') clean.startDate = null;
  if (clean.endDate === '') clean.endDate = null;
  if (clean.birthday === '') clean.birthday = null;

  if (clean.role === 'VP') clean.role = 'Head';
  if (clean.role === 'Engineer/Analyst' || clean.role === 'ENGINEER/ANALYST') {
    clean.role = 'Engineer';
  }

  return stripImageRefFields(clean, ['photoUrl']);
}

export function sanitizeOrganizationTeamDto(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_TEAM_FIELDS.has(key)) clean[key] = data[key];
  }

  if (clean.parentTeamId === '') clean.parentTeamId = null;
  if (clean.leaderId === '') clean.leaderId = null;

  return clean;
}
