import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Vendor, VendorContext } from '../../../domain/entities/Vendor.js';
import { VendorService } from '../../../application/services/vendor.service.js';
import { CreateVendorDto, UpdateVendorDto } from '../../../application/dtos/vendor.dto.js';

@ApiTags('vendors')
@Controller(['vendors', 'api/vendors'])
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get()
  @ApiOperation({ summary: 'List vendors by optional company/department scope' })
  list(
    @Query('companyId') companyId?: string,
    @Query('departmentId') departmentId?: string
  ): Promise<Vendor[]> {
    return this.vendorService.listVendors({ companyId, departmentId });
  }

  @Get('context')
  @ApiOperation({ summary: 'Get vendors aggregate context for screens' })
  context(
    @Query('companyId') companyId?: string,
    @Query('departmentId') departmentId?: string
  ): Promise<VendorContext> {
    return this.vendorService.getVendorsContext({ companyId, departmentId });
  }

  @Post()
  @ApiOperation({ summary: 'Create vendor' })
  create(@Body() payload: CreateVendorDto): Promise<Vendor> {
    return this.vendorService.createVendor(payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vendor' })
  update(@Param('id') id: string, @Body() payload: UpdateVendorDto): Promise<Vendor> {
    return this.vendorService.updateVendor(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vendor' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.vendorService.deleteVendor(id);
    return { message: 'Vendor deleted' };
  }
}
