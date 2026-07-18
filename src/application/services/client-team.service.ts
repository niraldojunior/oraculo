import { Inject, Injectable } from '@nestjs/common';
import type { ClientTeam, ClientTeamWriteData } from '../../domain/entities/ClientTeam.js';
import { CLIENT_TEAM_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { ClientTeamRepository } from '../../domain/repositories/ClientTeamRepository.js';

@Injectable()
export class ClientTeamService {
  constructor(
    @Inject(CLIENT_TEAM_REPOSITORY)
    private readonly repository: ClientTeamRepository
  ) {}

  listClientTeams(scope: { companyId?: string; departmentId?: string }): Promise<ClientTeam[]> {
    return this.repository.listClientTeams(scope);
  }

  createClientTeam(data: ClientTeamWriteData): Promise<ClientTeam> {
    return this.repository.createClientTeam(data);
  }

  updateClientTeam(id: string, data: ClientTeamWriteData): Promise<ClientTeam> {
    return this.repository.updateClientTeam(id, data);
  }

  deleteClientTeam(id: string): Promise<void> {
    return this.repository.deleteClientTeam(id);
  }
}
