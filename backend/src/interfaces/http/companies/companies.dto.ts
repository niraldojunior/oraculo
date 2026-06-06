export function sanitizeCompanyDto(data: Record<string, any>) {
  const clean = { ...data } as Record<string, any>;
  if (typeof clean.logo === 'string' && clean.logo.startsWith('/api/_img/')) {
    delete clean.logo;
  }
  return clean;
}
