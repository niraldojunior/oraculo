const VALID_CONTRACT_FIELDS = new Set([
  'companyId',
  'departmentId',
  'vendorId',
  'name',
  'number',
  'startDate',
  'endDate',
  'model',
  'annualCost',
  'description',
  'status',
  'systemId',
  'leaderId'
]);

export function sanitizeContractDto(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_CONTRACT_FIELDS.has(key)) clean[key] = data[key];
  }
  return clean;
}
