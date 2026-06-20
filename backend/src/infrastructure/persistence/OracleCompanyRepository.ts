import { randomUUID } from 'node:crypto';
import type { CompanyRepository, CompanyWriteData } from '../../domain/repositories/CompanyRepository.js';
import type { OracleRuntime } from './oracle.runtime.js';

type CompanyRow = Record<string, unknown>;

export class OracleCompanyRepository implements CompanyRepository {
  private readonly oracle: OracleRuntime;

  constructor(oracle: OracleRuntime) {
    this.oracle = oracle;
  }

  async listCompanies(_companyListOmit: unknown): Promise<any[]> {
    const rows = await this.oracle.query<CompanyRow>(
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

    return rows;
  }

  async createCompany(data: CompanyWriteData): Promise<any> {
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
        fantasyName: data.fantasyName,
        realName: data.realName,
        logo: data.logo,
        description: data.description
      }
    );

    const created = await this.findCompanyById(id);
    return created;
  }

  async updateCompany(id: string, data: CompanyWriteData): Promise<any> {
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

    const updated = await this.findCompanyById(id);
    return updated;
  }

  async deleteCompany(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "Company" WHERE "id" = :id', { id });
  }

  private async findCompanyById(id: string): Promise<any | null> {
    const rows = await this.oracle.query<CompanyRow>(
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

    return rows[0] ?? null;
  }
}