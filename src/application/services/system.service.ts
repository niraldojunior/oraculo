import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { System, SystemWriteData } from '../../domain/entities/System.js';
import type { SystemRepository } from '../../domain/repositories/SystemRepository.js';
import { SYSTEM_REPOSITORY } from '../../domain/repositories/tokens.js';

@Injectable()
export class SystemService {
  constructor(
    @Inject(SYSTEM_REPOSITORY)
    private readonly repository: SystemRepository
  ) {}

  listSystems(scope: { companyId?: string; departmentId?: string }): Promise<System[]> {
    return this.repository.listSystems(scope);
  }

  async getSystemById(id: string): Promise<System> {
    const system = await this.repository.findSystemById(id);
    if (!system) {
      throw new NotFoundException('System not found');
    }
    return system;
  }

  createSystem(data: SystemWriteData): Promise<System> {
    return this.repository.createSystem(this.sanitize(data));
  }

  updateSystem(id: string, data: SystemWriteData): Promise<System> {
    return this.repository.updateSystem(id, this.sanitize(data));
  }

  deleteSystem(id: string): Promise<void> {
    return this.repository.deleteSystem(id);
  }

  private sanitize(data: SystemWriteData): SystemWriteData {
    const clean = { ...data };
    if (clean.ownerTeamId === '') {
      clean.ownerTeamId = null;
    }
    return clean;
  }
}
