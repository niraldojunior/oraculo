export const systemListOmit = { contextFiles: true } as const;
export const companyListOmit = { logo: true } as const;
export const vendorListOmit = { logoUrl: true } as const;

export const collaboratorSafeSelect = {
  id: true,
  companyId: true,
  departmentId: true,
  name: true,
  photoUrl: true,
  email: true,
  role: true,
  squadId: true,
  phone: true,
  bio: true,
  linkedinUrl: true,
  githubUrl: true,
  isAdmin: true,
  associatedCompanyIds: true,
  vacationStart: true,
  startDate: true,
  endDate: true
} as const;

export const collaboratorDashboardSelect = {
  id: true,
  companyId: true,
  departmentId: true,
  name: true,
  photoUrl: true,
  email: true,
  role: true,
  squadId: true,
  phone: true,
  bio: true,
  linkedinUrl: true,
  githubUrl: true,
  isAdmin: true,
  associatedCompanyIds: true,
  vacationStart: true,
  startDate: true,
  endDate: true
} as const;

export const vendorLiteSelect = {
  id: true,
  companyId: true,
  departmentId: true,
  companyName: true,
  taxId: true,
  type: true,
  directorId: true,
  managerId: true
} as const;

export function normalizeTaskOrder(order: unknown, fallback = 0) {
  return Number.isInteger(order) ? Number(order) : fallback;
}

export function normalizeMilestoneOrder(order: unknown, fallback = 0) {
  return Number.isInteger(order) ? Number(order) : fallback;
}
