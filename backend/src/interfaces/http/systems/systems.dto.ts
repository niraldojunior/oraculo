const VALID_SYSTEM_FIELDS = new Set([
  'id',
  'name',
  'platformName',
  'domain',
  'subDomain',
  'criticality',
  'techStack',
  'ownerTeamId',
  'smeId',
  'lifecycleStatus',
  'debtScore',
  'description',
  'platformCategory',
  'vendorId',
  'repoUrl',
  'environments',
  'contextFiles',
  'companyId',
  'departmentId'
]);

export function sanitizeSystemDto(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_SYSTEM_FIELDS.has(key)) clean[key] = data[key];
  }

  if (clean.ownerTeamId === '') clean.ownerTeamId = null;
  if (clean.smeId === '') clean.smeId = null;
  if (clean.vendorId === '') clean.vendorId = null;

  return clean;
}
