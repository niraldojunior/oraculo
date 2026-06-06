import type { VendorRepository, VendorWriteData } from '../domain/repositories/VendorRepository.js';

export class VendorApplicationService {
  private readonly repository: VendorRepository;

  constructor(repository: VendorRepository) {
    this.repository = repository;
  }

  async listVendors(params: {
    scope: { companyId?: string; departmentId?: string };
    lite: boolean;
    vendorLiteSelect: any;
    vendorListOmit: any;
  }) {
    return this.repository.listVendors(params);
  }

  async getVendorsContext(params: {
    scope: { companyId?: string; departmentId?: string };
    collaboratorSafeSelect: any;
    vendorListOmit: any;
    systemListOmit: any;
    companyListOmit: any;
  }) {
    return this.repository.getVendorsContext(params);
  }

  async createVendor(data: VendorWriteData) {
    return this.repository.createVendor(data);
  }

  async updateVendor(id: string, data: VendorWriteData) {
    return this.repository.updateVendor(id, data);
  }

  async deleteVendor(id: string) {
    await this.repository.deleteVendor(id);
  }
}