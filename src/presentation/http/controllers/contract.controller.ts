import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Contract } from '../../../domain/entities/Contract.js';
import { ContractService } from '../../../application/services/contract.service.js';
import { CreateContractDto, UpdateContractDto } from '../../../application/dtos/contract.dto.js';

@ApiTags('contracts')
@Controller(['contracts', 'api/contracts'])
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get()
  @ApiOperation({ summary: 'List contracts by optional company/department scope' })
  list(
    @Query('companyId') companyId?: string,
    @Query('departmentId') departmentId?: string
  ): Promise<Contract[]> {
    return this.contractService.listContracts({ companyId, departmentId });
  }

  @Post()
  @ApiOperation({ summary: 'Create contract' })
  create(@Body() payload: CreateContractDto): Promise<Contract> {
    return this.contractService.createContract(payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contract' })
  update(@Param('id') id: string, @Body() payload: UpdateContractDto): Promise<Contract> {
    return this.contractService.updateContract(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contract' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.contractService.deleteContract(id);
    return { message: 'Contract deleted' };
  }
}
