function imageRef(
  value: string | null | undefined,
  kind: 'collaborator' | 'company' | 'vendor' | 'skill',
  id: string
): string | null | undefined {
  if (value == null || value === '') return value;
  if (value.startsWith('/api/_img/')) return value;
  if (value.startsWith('data:')) return `/api/_img/${kind}/${id}`;
  return value;
}

export function transformCollaboratorImage<T extends { id: string; photoUrl?: string | null }>(c: T): T {
  if (!c) return c;
  const rawPhoto = (c as any).photoUrl;
  if (!rawPhoto) return c;

  (c as any).photoUrl = imageRef(rawPhoto, 'collaborator', c.id);
  return c;
}

export function transformCompanyImage<T extends { id: string; logo?: string | null }>(c: T): T {
  if (!c) return c;
  if (c.logo) (c as any).logo = imageRef(c.logo, 'company', c.id);
  else if ((c as any).logo === undefined) (c as any).logo = `/api/_img/company/${c.id}`;
  return c;
}

export function transformVendorImage<T extends { id: string; logoUrl?: string | null }>(v: T): T {
  if (!v) return v;
  if (v.logoUrl) (v as any).logoUrl = imageRef(v.logoUrl, 'vendor', v.id);
  else if ((v as any).logoUrl === undefined) (v as any).logoUrl = `/api/_img/vendor/${v.id}`;
  return v;
}

export function transformSkillImage<T extends { id: string; icon?: string | null }>(s: T): T {
  if (!s) return s;
  if (s.icon) (s as any).icon = imageRef(s.icon, 'skill', s.id);
  else if ((s as any).icon === undefined) (s as any).icon = `/api/_img/skill/${s.id}`;
  return s;
}
