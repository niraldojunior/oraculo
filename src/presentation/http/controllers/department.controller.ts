import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Department } from '../../../domain/entities/Department.js';
import { DepartmentService } from '../../../application/services/department.service.js';
import { CreateDepartmentDto, UpdateDepartmentDto } from '../../../application/dtos/department.dto.js';

@ApiTags('departments')
@Controller(['departments', 'api/departments'])
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get()
  @ApiOperation({ summary: 'List departments' })
  list(): Promise<Department[]> {
    return this.departmentService.listDepartments();
  }

  @Patch(':id/basic')
  @ApiOperation({ summary: 'Update department basic fields' })
  updateBasic(@Param('id') id: string, @Body() payload: UpdateDepartmentDto): Promise<Department> {
    const { masterUser, masterUserId, ...departmentData } = payload;
    return this.departmentService.updateDepartmentBasic(id, departmentData);
  }

  @Post()
  @ApiOperation({ summary: 'Create department with optional master assignment' })
  create(@Body() payload: CreateDepartmentDto): Promise<Department> {
    const { masterUser, masterUserId, ...departmentData } = payload;
    return this.departmentService.createDepartmentWithMaster({
      departmentData,
      masterUser,
      masterUserId
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update department and optional master assignment' })
  updateWithMaster(@Param('id') id: string, @Body() payload: UpdateDepartmentDto): Promise<Department> {
    const { masterUser, masterUserId, ...departmentData } = payload;
    return this.departmentService.updateDepartmentWithMaster({
      id,
      departmentData,
      masterUser,
      masterUserId
    });
  }
}
