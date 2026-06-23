import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Vendor, VendorContext, VendorWriteData } from '../../../domain/entities/Vendor.js';
import type { VendorRepository } from '../../../domain/repositories/VendorRepository.js';

@Injectable()
export class InMemoryVendorRepository implements VendorRepository {
  private readonly vendors = new Map<string, Vendor>();

  async listVendors(scope: { companyId?: string; departmentId?: string }): Promise<Vendor[]> {
    return [...this.vendors.values()].filter(item => {
      if (scope.companyId && item.companyId !== scope.companyId) return false;
      if (scope.departmentId && item.departmentId !== scope.departmentId) return false;
      return true;
    });
  }

  async getVendorsContext(scope: { companyId?: string; departmentId?: string }): Promise<VendorContext> {
    const vendors = await this.listVendors(scope);
    return {
      vendors,
      contracts: [],
      systems: [],
      collaborators: [],
      companies: [],
      departments: []
    };
  }

  async createVendor(data: VendorWriteData): Promise<Vendor> {
    const created: Vendor = {
      id: randomUUID(),
      companyId: data.companyId ?? '',
      departmentId: data.departmentId ?? '',
      companyName: data.companyName ?? '',
      taxId: data.taxId ?? '',
      type: data.type ?? '',
      logoUrl: data.logoUrl ?? null,
      directorId: data.directorId ?? null,
      managerId: data.managerId ?? null
    };
    this.vendors.set(created.id, created);
    return created;
  }

  async updateVendor(id: string, data: VendorWriteData): Promise<Vendor> {
    const current = this.vendors.get(id);
    if (!current) {
      throw new Error('Vendor not found');
    }

    const updated: Vendor = { ...current, ...data };
    this.vendors.set(id, updated);
    return updated;
  }

  async deleteVendor(id: string): Promise<void> {
    this.vendors.delete(id);
  }
}
