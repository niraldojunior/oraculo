const VALID_VENDOR_FIELDS = new Set([
  'companyId',
  'departmentId',
  'companyName',
  'taxId',
  'type',
  'logoUrl',
  'directorId',
  'managerId'
]);

function stripVendorImageRef(data: Record<string, any>) {
  if (typeof data.logoUrl === 'string' && data.logoUrl.startsWith('/api/_img/')) {
    delete data.logoUrl;
  }
  return data;
}

export function sanitizeVendorDto(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (VALID_VENDOR_FIELDS.has(key)) clean[key] = data[key];
  }

  return stripVendorImageRef(clean);
}
