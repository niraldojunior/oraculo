import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { VendorContext } from '../../../domain/entities/Vendor.js';
import { VendorService } from '../../../application/services/vendor.service.js';

@ApiTags('vendors')
@Controller(['vendors-context', 'api/vendors-context'])
export class VendorContextController {
  constructor(private readonly vendorService: VendorService) {}

  @Get()
  @ApiOperation({ summary: 'Get vendors aggregate context for screens (compat route)' })
  context(
    @Query('companyId') companyId?: string,
    @Query('departmentId') departmentId?: string
  ): Promise<VendorContext> {
    return this.vendorService.getVendorsContext({ companyId, departmentId });
  }
}