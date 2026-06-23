import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSystemDto, UpdateSystemDto } from '../../../application/dtos/system.dto.js';
import { SystemService } from '../../../application/services/system.service.js';
import type { System } from '../../../domain/entities/System.js';

@ApiTags('systems')
@Controller(['systems', 'api/systems'])
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get()
  @ApiOperation({ summary: 'List systems by optional company/department scope' })
  list(
    @Query('companyId') companyId?: string,
    @Query('departmentId') departmentId?: string
  ): Promise<System[]> {
    return this.systemService.listSystems({ companyId, departmentId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get system by id' })
  getById(@Param('id') id: string): Promise<System> {
    return this.systemService.getSystemById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create system' })
  create(@Body() payload: CreateSystemDto): Promise<System> {
    return this.systemService.createSystem(payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update system' })
  update(@Param('id') id: string, @Body() payload: UpdateSystemDto): Promise<System> {
    return this.systemService.updateSystem(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete system' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.systemService.deleteSystem(id);
    return { message: 'System deleted' };
  }
}
