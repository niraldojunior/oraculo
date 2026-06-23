import type { PrismaClient } from '@prisma/client';
import type { Contract, ContractWriteData } from '../../../domain/entities/Contract.js';
import type { ContractRepository } from '../../../domain/repositories/ContractRepository.js';

export class PrismaContractRepository implements ContractRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listContracts(scope: { companyId?: string; departmentId?: string }): Promise<Contract[]> {
    return this.prisma.contract.findMany({
      where: {
        ...(scope.companyId ? { companyId: scope.companyId } : {}),
        ...(scope.departmentId ? { departmentId: scope.departmentId } : {})
      }
    });
  }

  async createContract(data: ContractWriteData): Promise<Contract> {
    return this.prisma.contract.create({
      data: {
        companyId: data.companyId ?? '',
        departmentId: data.departmentId ?? '',
        vendorId: data.vendorId ?? '',
        number: data.number ?? '',
        startDate: data.startDate ?? '',
        endDate: data.endDate ?? '',
        model: data.model ?? '',
        annualCost: data.annualCost ?? 0,
        name: data.name ?? null,
        description: data.description ?? null,
        status: data.status ?? 'Ativo',
        systemId: data.systemId ?? null,
        leaderId: data.leaderId ?? null
      }
    });
  }

  async updateContract(id: string, data: ContractWriteData): Promise<Contract> {
    return this.prisma.contract.update({
      where: { id },
      data: {
        ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.vendorId !== undefined ? { vendorId: data.vendorId } : {}),
        ...(data.number !== undefined ? { number: data.number } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
        ...(data.model !== undefined ? { model: data.model } : {}),
        ...(data.annualCost !== undefined ? { annualCost: data.annualCost } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.systemId !== undefined ? { systemId: data.systemId } : {}),
        ...(data.leaderId !== undefined ? { leaderId: data.leaderId } : {})
      }
    });
  }

  async deleteContract(id: string): Promise<void> {
    await this.prisma.contract.delete({ where: { id } });
  }
}
