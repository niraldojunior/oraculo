import { Inject, Injectable } from '@nestjs/common';
import type { BusinessUnit, BusinessUnitWriteData } from '../../domain/entities/BusinessUnit.js';
import { BUSINESS_UNIT_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { BusinessUnitRepository } from '../../domain/repositories/BusinessUnitRepository.js';

@Injectable()
export class BusinessUnitService {
  constructor(
    @Inject(BUSINESS_UNIT_REPOSITORY)
    private readonly repository: BusinessUnitRepository
  ) {}

  listBusinessUnits(scope: { companyId?: string; departmentId?: string }): Promise<BusinessUnit[]> {
    return this.repository.listBusinessUnits(scope);
  }

  createBusinessUnit(data: BusinessUnitWriteData): Promise<BusinessUnit> {
    return this.repository.createBusinessUnit(data);
  }

  updateBusinessUnit(id: string, data: BusinessUnitWriteData): Promise<BusinessUnit> {
    return this.repository.updateBusinessUnit(id, data);
  }

  deleteBusinessUnit(id: string): Promise<void> {
    return this.repository.deleteBusinessUnit(id);
  }
}
