const VALID_INITIATIVE_SCALAR_FIELDS = new Set([
  'title',
  'type',
  'benefit',
  'benefitType',
  'scope',
  'customerOwner',
  'originDirectorate',
  'leaderId',
  'technicalLeadId',
  'impactedSystemIds',
  'requestDate',
  'businessExpectationDate',
  'status',
  'previousStatus',
  'companyId',
  'departmentId',
  'executingDirectorate',
  'executingTeamId',
  'rationale',
  'externalLinkType',
  'externalLinkName',
  'externalLinkUrl',
  'macroScope',
  'createdById',
  'assignedManagerId',
  'initiativeType',
  'priority',
  'memberIds',
  'startDate',
  'endDate',
  'actualEndDate'
]);

export function sanitizeInitiativeDto(data: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};

  for (const key of Object.keys(data)) {
    if (VALID_INITIATIVE_SCALAR_FIELDS.has(key)) {
      clean[key] = data[key];
    }
  }

  if (clean.benefitType === '') clean.benefitType = null;
  if (clean.technicalLeadId === '') clean.technicalLeadId = null;
  if (clean.businessExpectationDate === '') clean.businessExpectationDate = null;
  if (clean.previousStatus === '') clean.previousStatus = null;

  return clean;
}
