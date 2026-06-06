export function sanitizeSkillDto(data: Record<string, any>) {
  const clean = { ...data } as Record<string, any>;
  if (typeof clean.icon === 'string' && clean.icon.startsWith('/api/_img/')) {
    delete clean.icon;
  }
  return clean;
}
