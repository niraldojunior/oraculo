import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Initiative } from '../../../domain/entities/Initiative.js';
import { CreateInitiativeDto, ReprioritizeInitiativeDto } from '../../../application/dtos/initiative.dto.js';
import { InitiativeService } from '../../../application/services/initiative.service.js';

@ApiTags('initiatives')
@Controller(['initiatives', 'api/initiatives'])
export class InitiativeController {
  constructor(private readonly initiativeService: InitiativeService) {}

  @Get()
  @ApiOperation({ summary: 'List initiatives by optional company/department scope' })
  list(
    @Query('companyId') companyId?: string,
    @Query('departmentId') departmentId?: string
  ): Promise<Initiative[]> {
    return this.initiativeService.listByScope({ companyId, departmentId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get initiative by id' })
  getById(@Param('id') id: string): Promise<Initiative> {
    return this.initiativeService.getById(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get initiative history by id' })
  getHistory(@Param('id') id: string): Promise<unknown[]> {
    return this.initiativeService.getHistory(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create initiative' })
  create(@Body() payload: CreateInitiativeDto): Promise<Initiative> {
    return this.initiativeService.create(payload);
  }

  @Patch(':id/priority')
  @ApiOperation({ summary: 'Reprioritize initiative' })
  reprioritize(
    @Param('id') id: string,
    @Body() payload: ReprioritizeInitiativeDto
  ): Promise<Initiative> {
    return this.initiativeService.reprioritize(id, payload.priority);
  }
}
