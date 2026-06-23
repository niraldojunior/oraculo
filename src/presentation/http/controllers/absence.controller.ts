import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateAbsenceDto, ListAbsencesQueryDto } from '../../../application/dtos/absence.dto.js';
import { AbsenceService } from '../../../application/services/absence.service.js';
import type { Absence } from '../../../domain/entities/Absence.js';

@ApiTags('absences')
@Controller(['absences', 'api/absences'])
export class AbsenceController {
  constructor(private readonly absenceService: AbsenceService) {}

  @Get()
  @ApiOperation({ summary: 'List absences by company/department/team scope' })
  list(@Query() query: ListAbsencesQueryDto): Promise<Absence[]> {
    return this.absenceService.listAbsences(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create absence' })
  create(@Body() payload: CreateAbsenceDto): Promise<Absence> {
    return this.absenceService.createAbsence(payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete absence' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.absenceService.deleteAbsence(id);
    return { message: 'Absence deleted' };
  }
}
