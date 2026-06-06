import type { PrismaClient } from '@prisma/client';
import type { ContractRepository, ContractWriteData } from '../../domain/repositories/ContractRepository.js';

export class PrismaContractRepository implements ContractRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async listContracts(scope: { companyId?: string; departmentId?: string }): Promise<any[]> {
    return this.prisma.contract.findMany({ where: scope });
  }

  async createContract(data: ContractWriteData): Promise<any> {
    return this.prisma.contract.create({ data: data as any });
  }

  async updateContract(id: string, data: ContractWriteData): Promise<any> {
    return this.prisma.contract.update({
      where: { id },
      data: data as any
    });
  }

  async deleteContract(id: string): Promise<void> {
    await this.prisma.contract.delete({ where: { id } });
  }
}