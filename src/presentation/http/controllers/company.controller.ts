import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Company } from '../../../domain/entities/Company.js';
import { CompanyService } from '../../../application/services/company.service.js';
import { CreateCompanyDto, UpdateCompanyDto } from '../../../application/dtos/company.dto.js';

@ApiTags('companies')
@Controller(['companies', 'api/companies'])
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiOperation({ summary: 'List companies' })
  list(): Promise<Company[]> {
    return this.companyService.listCompanies();
  }

  @Post()
  @ApiOperation({ summary: 'Create company' })
  create(@Body() payload: CreateCompanyDto): Promise<Company> {
    return this.companyService.createCompany(payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update company' })
  update(
    @Param('id') id: string,
    @Body() payload: UpdateCompanyDto
  ): Promise<Company> {
    return this.companyService.updateCompany(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete company' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.companyService.deleteCompany(id);
    return { message: 'Company deleted' };
  }
}
