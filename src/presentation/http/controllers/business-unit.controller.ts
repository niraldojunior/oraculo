import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { BusinessUnit } from '../../../domain/entities/BusinessUnit.js';
import { BusinessUnitService } from '../../../application/services/business-unit.service.js';
import { CreateBusinessUnitDto, UpdateBusinessUnitDto } from '../../../application/dtos/business-unit.dto.js';

@ApiTags('business-units')
@Controller(['business-units', 'api/business-units'])
export class BusinessUnitController {
  constructor(private readonly businessUnitService: BusinessUnitService) {}

  @Get()
  @ApiOperation({ summary: 'List business units by optional company/department scope' })
  list(
    @Query('companyId') companyId?: string,
    @Query('departmentId') departmentId?: string
  ): Promise<BusinessUnit[]> {
    return this.businessUnitService.listBusinessUnits({ companyId, departmentId });
  }

  @Post()
  @ApiOperation({ summary: 'Create business unit' })
  create(@Body() payload: CreateBusinessUnitDto): Promise<BusinessUnit> {
    return this.businessUnitService.createBusinessUnit(payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update business unit' })
  update(@Param('id') id: string, @Body() payload: UpdateBusinessUnitDto): Promise<BusinessUnit> {
    return this.businessUnitService.updateBusinessUnit(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete business unit' })
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.businessUnitService.deleteBusinessUnit(id);
    return { success: true };
  }
}
