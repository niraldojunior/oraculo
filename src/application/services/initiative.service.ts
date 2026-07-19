import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Initiative } from '../../domain/entities/Initiative.js';
import type { ClientTeam } from '../../domain/entities/ClientTeam.js';
import { CLIENT_TEAM_REPOSITORY, INITIATIVE_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { InitiativeRepository } from '../../domain/repositories/InitiativeRepository.js';
import type { ClientTeamRepository } from '../../domain/repositories/ClientTeamRepository.js';
import { prioritizeInitiative } from '../../domain/services/PrioritizeInitiative.js';
import type { CreateInitiativeDto } from '../dtos/initiative.dto.js';
import { CacheService } from '../../infrastructure/cache/cache.service.js';

@Injectable()
export class InitiativeService {
  constructor(
    @Inject(INITIATIVE_REPOSITORY)
    private readonly repository: InitiativeRepository,
    private readonly cache: CacheService,
    @Inject(CLIENT_TEAM_REPOSITORY)
    private readonly clientTeamRepository: ClientTeamRepository
  ) {}

  private async resolveClientTeam(
    payload: Record<string, unknown>,
    companyId?: string,
    departmentId?: string
  ): Promise<ClientTeam | null | undefined> {
    const hasClientTeamId = Object.prototype.hasOwnProperty.call(payload, 'clientTeamId');
    const hasLegacyName = Object.prototype.hasOwnProperty.call(payload, 'originDirectorate');
    if (!hasClientTeamId && !hasLegacyName) return undefined;

    if (!companyId || !departmentId) {
      throw new BadRequestException('companyId and departmentId are required to assign a client team');
    }

    let team: ClientTeam | null = null;
    if (hasClientTeamId) {
      const value = payload.clientTeamId;
      if (value == null || value === '') return null;
      if (typeof value !== 'string') {
        throw new BadRequestException('clientTeamId must be a string or null');
      }
      team = await this.clientTeamRepository.findClientTeamById(value);
      if (!team) throw new BadRequestException('ClientTeam not found');
    } else {
      const legacyName = payload.originDirectorate;
      if (legacyName == null || legacyName === '') return null;
      if (typeof legacyName !== 'string') {
        throw new BadRequestException('originDirectorate must be a string');
      }
      const matches = (await this.clientTeamRepository.listClientTeams({ companyId, departmentId }))
        .filter(candidate => candidate.name === legacyName);
      if (matches.length === 0) throw new BadRequestException('ClientTeam not found for originDirectorate');
      if (matches.length > 1) {
        throw new ConflictException('originDirectorate is ambiguous; use clientTeamId');
      }
      team = matches[0] ?? null;
    }

    if (team && (team.companyId !== companyId || team.departmentId !== departmentId)) {
      throw new BadRequestException('ClientTeam must belong to the initiative scope');
    }
    return team;
  }

  private listKey(scope: { companyId?: string; departmentId?: string }): string {
    return `initiatives:list:${scope.companyId ?? ''}:${scope.departmentId ?? ''}`;
  }

  listByScope(scope: { companyId?: string; departmentId?: string }): Promise<Initiative[]> {
    return this.cache.getOrFetch(
      this.listKey(scope),
      () => this.repository.listByScope(scope)
    );
  }

  async getById(id: string): Promise<Initiative> {
    const initiative = await this.cache.getOrFetch(
      `initiatives:id:${id}`,
      () => this.repository.findById(id)
    );
    if (!initiative) {
      throw new NotFoundException('Initiative not found');
    }
    return initiative;
  }

  async getHistory(id: string): Promise<unknown[]> {
    const initiative = await this.getById(id);
    const history = (initiative as Initiative & { history?: unknown[] }).history;
    return Array.isArray(history) ? history : [];
  }

  async create(payload: CreateInitiativeDto): Promise<Initiative> {
    const team = await this.resolveClientTeam(
      payload as unknown as Record<string, unknown>,
      payload.companyId,
      payload.departmentId
    );
    const result = await this.repository.create({
      ...payload,
      clientTeamId: team?.id ?? null,
      clientTeam: team ?? null,
      originDirectorate: team?.name
    });
    this.cache.invalidatePrefix('initiatives');
    return result;
  }

  async delete(id: string): Promise<void> {
    const current = await this.getById(id);
    await this.repository.delete(current.id);
    this.cache.invalidatePrefix('initiatives');
  }

  async update(id: string, payload: Record<string, unknown>): Promise<Initiative> {
    const current = await this.getById(id);
    const companyId = typeof payload.companyId === 'string' ? payload.companyId : current.companyId;
    const departmentId = typeof payload.departmentId === 'string' ? payload.departmentId : current.departmentId;
    const selectedTeam = await this.resolveClientTeam(payload, companyId, departmentId);
    const currentHistory = Array.isArray(current.history) ? current.history : [];
    const currentMilestones = Array.isArray(current.milestones) ? current.milestones : [];
    const incomingHistory = Array.isArray(payload.history) ? payload.history : [];
    const incomingMilestones = Array.isArray(payload.milestones) ? payload.milestones : [];
    const removedMilestoneIds = Array.isArray(payload.removedMilestoneIds)
      ? new Set(payload.removedMilestoneIds.map(v => String(v)))
      : new Set<string>();

    const mergedHistory = [
      ...currentHistory,
      ...incomingHistory.filter(entry => {
        const idValue = (entry as { id?: unknown }).id;
        return !idValue || !currentHistory.some(existing => String((existing as { id?: unknown }).id) === String(idValue));
      })
    ];

    const milestoneMap = new Map<string, unknown>();
    currentMilestones.forEach((milestone, index) => {
      const key = String((milestone as { id?: unknown }).id ?? index);
      if (!removedMilestoneIds.has(key)) milestoneMap.set(key, milestone);
    });
    incomingMilestones.forEach((milestone, index) => {
      const key = String((milestone as { id?: unknown }).id ?? index);
      if (!removedMilestoneIds.has(key)) milestoneMap.set(key, milestone);
    });

    const mergedMilestones = [...milestoneMap.values()].sort((a, b) => {
      const orderA = Number((a as { order?: unknown }).order ?? 0);
      const orderB = Number((b as { order?: unknown }).order ?? 0);
      return orderA - orderB;
    });

    const updated = {
      ...current,
      ...payload,
      id: current.id,
      clientTeamId: selectedTeam === undefined ? current.clientTeamId ?? null : selectedTeam?.id ?? null,
      clientTeam: selectedTeam === undefined ? current.clientTeam ?? null : selectedTeam,
      originDirectorate: selectedTeam === undefined
        ? current.clientTeam?.name ?? current.originDirectorate
        : selectedTeam?.name,
      history: mergedHistory,
      milestones: mergedMilestones,
    } as Initiative;

    const result = await this.repository.save(updated);
    this.cache.invalidatePrefix('initiatives');
    return result;
  }

  async reprioritize(id: string, nextPriority: number): Promise<Initiative> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException('Initiative not found');
    }

    const updated = prioritizeInitiative(current, nextPriority);
    const result = await this.repository.save(updated);
    this.cache.invalidatePrefix('initiatives');
    return result;
  }
}
