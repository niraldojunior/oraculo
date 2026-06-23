import { Inject, Injectable } from '@nestjs/common';
import type { Vendor, VendorContext, VendorWriteData } from '../../domain/entities/Vendor.js';
import { VENDOR_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { VendorRepository } from '../../domain/repositories/VendorRepository.js';

@Injectable()
export class VendorService {
  constructor(
    @Inject(VENDOR_REPOSITORY)
    private readonly repository: VendorRepository
  ) {}

  listVendors(scope: { companyId?: string; departmentId?: string }): Promise<Vendor[]> {
    return this.repository.listVendors(scope);
  }

  getVendorsContext(scope: { companyId?: string; departmentId?: string }): Promise<VendorContext> {
    return this.repository.getVendorsContext(scope);
  }

  createVendor(data: VendorWriteData): Promise<Vendor> {
    return this.repository.createVendor(this.sanitizeVendor(data));
  }

  updateVendor(id: string, data: VendorWriteData): Promise<Vendor> {
    return this.repository.updateVendor(id, this.sanitizeVendor(data));
  }

  deleteVendor(id: string): Promise<void> {
    return this.repository.deleteVendor(id);
  }

  private sanitizeVendor(data: VendorWriteData): VendorWriteData {
    const clean = { ...data };
    if (typeof clean.logoUrl === 'string' && clean.logoUrl.startsWith('/api/_img/')) {
      delete clean.logoUrl;
    }
    return clean;
  }
}
