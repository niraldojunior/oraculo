import type { AuthUser } from '../../../domain/entities/Auth.js';
import type { AuthRepository } from '../../../domain/repositories/AuthRepository.js';
import type { OracleService } from './oracle.service.js';

type Row = Record<string, unknown>;

function parseAssociatedCompanies(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(item => String(item));
  if (typeof value !== 'string') return [];
  if (!value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(item => String(item)) : [];
  } catch {
    return [];
  }
}

export class OracleAuthRepository implements AuthRepository {
  constructor(private readonly oracle: OracleService) {}

  async findCollaboratorByEmail(email: string): Promise<AuthUser | null> {
    const rows = await this.oracle.query<Row>(
      `
        SELECT
          "id",
          "email",
          "password",
          "name",
          "isAdmin",
          "companyId",
          "departmentId",
          "role",
          "associatedCompanyIds"
        FROM "Collaborator"
        WHERE LOWER("email") = :email
      `,
      { email: email.toLowerCase() }
    );

    const row = rows[0];
    if (!row) return null;

    return {
      id: String(row.id),
      email: String(row.email ?? ''),
      password: String(row.password ?? ''),
      name: String(row.name ?? ''),
      isAdmin: Boolean(row.isAdmin),
      companyId: String(row.companyId ?? ''),
      departmentId: String(row.departmentId ?? ''),
      role: String(row.role ?? ''),
      associatedCompanyIds: parseAssociatedCompanies(row.associatedCompanyIds)
    };
  }
}
