import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventoryContextQueryDto } from '../../../application/dtos/inventory.dto.js';
import { InventoryService } from '../../../application/services/inventory.service.js';
import type { InventoryContext } from '../../../domain/entities/Inventory.js';

@ApiTags('inventory')
@Controller(['', 'api'])
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('inventory-context')
  @ApiOperation({ summary: 'Get inventory context by optional company/department scope' })
  getContext(@Query() query: InventoryContextQueryDto): Promise<InventoryContext> {
    return this.inventoryService.getInventoryContext({
      companyId: query.companyId,
      departmentId: query.departmentId
    });
  }
}
