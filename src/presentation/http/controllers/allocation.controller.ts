import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllocationService } from '../../../application/services/allocation.service.js';
import type { Allocation } from '../../../domain/entities/Allocation.js';

@ApiTags('allocations')
@Controller('allocations')
export class AllocationController {
  constructor(private readonly allocationService: AllocationService) {}

  @Get()
  @ApiOperation({ summary: 'List allocations' })
  list(): Promise<Allocation[]> {
    return this.allocationService.listAllocations();
  }
}
