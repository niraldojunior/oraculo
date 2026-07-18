import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { BusinessUnit, BusinessUnitWriteData } from '../../../domain/entities/BusinessUnit.js';
import type { BusinessUnitRepository } from '../../../domain/repositories/BusinessUnitRepository.js';

@Injectable()
export class InMemoryBusinessUnitRepository implements BusinessUnitRepository {
  private readonly businessUnits = new Map<string, BusinessUnit>();

  async listBusinessUnits(scope: { companyId?: string; departmentId?: string }): Promise<BusinessUnit[]> {
    return [...this.businessUnits.values()].filter(item => {
      if (scope.companyId && item.companyId !== scope.companyId) return false;
      if (scope.departmentId && item.departmentId !== scope.departmentId) return false;
      return true;
    });
  }

  async createBusinessUnit(data: BusinessUnitWriteData): Promise<BusinessUnit> {
    const created: BusinessUnit = {
      id: randomUUID(),
      name: data.name ?? '',
      companyId: data.companyId ?? '',
      departmentId: data.departmentId ?? ''
    };
    this.businessUnits.set(created.id, created);
    return created;
  }

  async updateBusinessUnit(id: string, data: BusinessUnitWriteData): Promise<BusinessUnit> {
    const current = this.businessUnits.get(id);
    if (!current) {
      throw new Error('BusinessUnit not found');
    }

    const updated: BusinessUnit = { ...current, ...data };
    this.businessUnits.set(id, updated);
    return updated;
  }

  async deleteBusinessUnit(id: string): Promise<void> {
    this.businessUnits.delete(id);
  }
}
