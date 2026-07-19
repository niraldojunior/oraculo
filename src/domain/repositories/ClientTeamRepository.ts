import type { ClientTeam, ClientTeamWriteData } from '../entities/ClientTeam.js';

export interface ClientTeamRepository {
  listClientTeams(scope: { companyId?: string; departmentId?: string }): Promise<ClientTeam[]>;
  findClientTeamById(id: string): Promise<ClientTeam | null>;
  createClientTeam(data: ClientTeamWriteData): Promise<ClientTeam>;
  updateClientTeam(id: string, data: ClientTeamWriteData): Promise<ClientTeam>;
  deleteClientTeam(id: string): Promise<void>;
}
