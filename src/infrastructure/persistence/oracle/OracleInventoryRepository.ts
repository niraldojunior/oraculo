import type { InventoryContext, InventoryScope } from '../../../domain/entities/Inventory.js';
import type { InventoryRepository } from '../../../domain/repositories/InventoryRepository.js';
import type { OracleService } from './oracle.service.js';

type Row = Record<string, unknown>;

export class OracleInventoryRepository implements InventoryRepository {
  constructor(private readonly oracle: OracleService) {}

  async getInventoryContext(scope: InventoryScope): Promise<InventoryContext> {
    const binds = {
      companyId: scope.companyId ?? null,
      departmentId: scope.departmentId ?? null
    };

    const [systems, teams, collaborators, vendors, departments] = await Promise.all([
      this.oracle.query<Row>(
        `
          SELECT
            "id",
            "companyId",
            "departmentId",
            "name",
            "category",
            "criticality",
            "ownerTeamId",
            "lifecycleStatus",
            "debtScore",
            "description",
            "environments",
            "contextFiles",
            "technicalSkills",
            "responsibleCollaborators"
          FROM "System"
          WHERE (:companyId IS NULL OR "companyId" = :companyId)
            AND (:departmentId IS NULL OR "departmentId" = :departmentId)
        `,
        binds
      ),
      this.oracle.query<Row>(
        `
          SELECT
            "id",
            "companyId",
            "departmentId",
            "name",
            "type",
            "parentTeamId",
            "leaderId",
            "receivesInitiatives"
          FROM "Team"
          WHERE (:companyId IS NULL OR "companyId" = :companyId)
            AND (:departmentId IS NULL OR "departmentId" = :departmentId)
        `,
        binds
      ),
      this.oracle.query<Row>(
        `
          SELECT
            "id",
            "companyId",
            "departmentId",
            "name",
            "photoUrl",
            "email",
            "role",
            "teamId" AS "squadId",
            "phone",
            "bio",
            "linkedinUrl",
            "githubUrl",
            "isAdmin",
            "associatedCompanyIds",
            "vacationStart",
            "startDate",
            "endDate",
            "birthday",
            "uf"
          FROM "Collaborator"
          WHERE (:companyId IS NULL OR "companyId" = :companyId)
            AND (:departmentId IS NULL OR "departmentId" = :departmentId)
        `,
        binds
      ),
      this.oracle.query<Row>(
        `
          SELECT
            "id",
            "companyId",
            "departmentId",
            "companyName",
            "taxId",
            "type",
            "logoUrl",
            "directorId",
            "managerId"
          FROM "Vendor"
          WHERE (:companyId IS NULL OR "companyId" = :companyId)
            AND (:departmentId IS NULL OR "departmentId" = :departmentId)
        `,
        binds
      ),
      this.oracle.query<Row>(
        `
          SELECT
            "id",
            "name",
            "companyId",
            "masterUserId"
          FROM "Department"
          WHERE (:companyId IS NULL OR "companyId" = :companyId)
        `,
        { companyId: scope.companyId ?? null }
      )
    ]);

    return {
      systems: systems as unknown as InventoryContext['systems'],
      teams: teams as unknown as InventoryContext['teams'],
      collaborators: collaborators as unknown as InventoryContext['collaborators'],
      vendors: vendors as unknown as InventoryContext['vendors'],
      departments: departments as unknown as InventoryContext['departments']
    };
  }
}
