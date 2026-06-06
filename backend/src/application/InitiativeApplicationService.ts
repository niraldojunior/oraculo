import type { Initiative } from '../domain/models/Initiative.js';
import type { InitiativeRepository } from '../domain/repositories/InitiativeRepository.js';
import { prioritizeInitiative } from '../domain/services/PrioritizeInitiative.js';

export class InitiativeApplicationService {
  private readonly repository: InitiativeRepository;

  constructor(repository: InitiativeRepository) {
    this.repository = repository;
  }

  async listByScope(scope: { companyId?: string; departmentId?: string }) {
    return this.repository.listByScope(scope);
  }

  async reprioritize(id: string, nextPriority: number): Promise<Initiative | null> {
    const current = await this.repository.findById(id);
    if (!current) return null;

    const updated = prioritizeInitiative(current, nextPriority);
    return this.repository.save(updated);
  }
}
