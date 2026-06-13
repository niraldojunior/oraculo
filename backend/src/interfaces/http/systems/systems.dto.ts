const VALID_SYSTEM_FIELDS = new Set([
  'id',
  'name',
  'category',
  'criticality',
  'ownerTeamId',
  'lifecycleStatus',
  'debtScore',
  'description',
  'environments',
  'contextFiles',
  'technicalSkills',
  'companyId',
  'departmentId'
]);

export function sanitizeSystemDto(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_SYSTEM_FIELDS.has(key)) clean[key] = data[key];
  }

  if (clean.ownerTeamId === '') clean.ownerTeamId = null;

  return clean;
}
