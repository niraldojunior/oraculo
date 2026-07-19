import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ClientTeam, ClientTeamWriteData } from '../../domain/entities/ClientTeam.js';
import { CLIENT_TEAM_REPOSITORY, INITIATIVE_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { ClientTeamRepository } from '../../domain/repositories/ClientTeamRepository.js';
import type { InitiativeRepository } from '../../domain/repositories/InitiativeRepository.js';
import { CacheService } from '../../infrastructure/cache/cache.service.js';

@Injectable()
export class ClientTeamService {
  constructor(
    @Inject(CLIENT_TEAM_REPOSITORY)
    private readonly repository: ClientTeamRepository,
    @Inject(INITIATIVE_REPOSITORY)
    private readonly initiativeRepository: InitiativeRepository,
    private readonly cache: CacheService
  ) {}

  listClientTeams(scope: { companyId?: string; departmentId?: string }): Promise<ClientTeam[]> {
    return this.repository.listClientTeams(scope);
  }

  async createClientTeam(data: ClientTeamWriteData): Promise<ClientTeam> {
    const result = await this.repository.createClientTeam(data);
    this.cache.invalidatePrefix('initiatives');
    return result;
  }

  async updateClientTeam(id: string, data: ClientTeamWriteData): Promise<ClientTeam> {
    const current = await this.repository.findClientTeamById(id);
    if (!current) throw new NotFoundException('ClientTeam not found');
    if (data.companyId !== undefined && data.companyId !== current.companyId) {
      throw new BadRequestException('ClientTeam companyId cannot be changed');
    }
    if (data.departmentId !== undefined && data.departmentId !== current.departmentId) {
      throw new BadRequestException('ClientTeam departmentId cannot be changed');
    }
    const result = await this.repository.updateClientTeam(id, data);
    this.cache.invalidatePrefix('initiatives');
    return result;
  }

  async deleteClientTeam(id: string): Promise<void> {
    const current = await this.repository.findClientTeamById(id);
    if (!current) throw new NotFoundException('ClientTeam not found');
    const references = await this.initiativeRepository.countByClientTeamId(id);
    if (references > 0) {
      throw new ConflictException(`ClientTeam is used by ${references} initiative(s)`);
    }
    await this.repository.deleteClientTeam(id);
    this.cache.invalidatePrefix('initiatives');
  }
}
