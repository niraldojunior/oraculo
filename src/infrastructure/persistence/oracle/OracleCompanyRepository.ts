import { randomUUID } from 'node:crypto';
import type { Company, CompanyWriteData } from '../../../domain/entities/Company.js';
import type { CompanyRepository } from '../../../domain/repositories/CompanyRepository.js';
import type { OracleService } from './oracle.service.js';

export class OracleCompanyRepository implements CompanyRepository {
  constructor(private readonly oracle: OracleService) {}

  async listCompanies(): Promise<Company[]> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT
          "id",
          "fantasyName",
          "realName",
          "logo",
          "description"
        FROM "Company"
      `
    );

    return rows.map(row => this.mapToDomain(row));
  }

  async createCompany(data: CompanyWriteData): Promise<Company> {
    const id = randomUUID();
    await this.oracle.execute(
      `
        INSERT INTO "Company" (
          "id", "fantasyName", "realName", "logo", "description"
        ) VALUES (
          :id, :fantasyName, :realName, :logo, :description
        )
      `,
      {
        id,
        fantasyName: data.fantasyName ?? '',
        realName: data.realName ?? '',
        logo: data.logo ?? '',
        description: data.description ?? ''
      }
    );

    const created = await this.findById(id);
    if (!created) {
      throw new Error('Failed to load created company');
    }

    return created;
  }

  async updateCompany(id: string, data: CompanyWriteData): Promise<Company> {
    const fields: string[] = [];
    const binds: Record<string, unknown> = { id };

    if (data.fantasyName !== undefined) {
      fields.push('"fantasyName" = :fantasyName');
      binds.fantasyName = data.fantasyName;
    }

    if (data.realName !== undefined) {
      fields.push('"realName" = :realName');
      binds.realName = data.realName;
    }

    if (data.logo !== undefined) {
      fields.push('"logo" = :logo');
      binds.logo = data.logo;
    }

    if (data.description !== undefined) {
      fields.push('"description" = :description');
      binds.description = data.description;
    }

    if (fields.length > 0) {
      await this.oracle.execute(
        `
          UPDATE "Company"
          SET ${fields.join(', ')}
          WHERE "id" = :id
        `,
        binds
      );
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Company not found');
    }

    return updated;
  }

  async deleteCompany(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "Company" WHERE "id" = :id', { id });
  }

  private async findById(id: string): Promise<Company | null> {
    const rows = await this.oracle.query<Record<string, unknown>>(
      `
        SELECT
          "id",
          "fantasyName",
          "realName",
          "logo",
          "description"
        FROM "Company"
        WHERE "id" = :id
      `,
      { id }
    );

    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  private mapToDomain(row: Record<string, unknown>): Company {
    return {
      id: String(row.id),
      fantasyName: String(row.fantasyName ?? ''),
      realName: String(row.realName ?? ''),
      logo: String(row.logo ?? ''),
      description: String(row.description ?? '')
    };
  }
}
