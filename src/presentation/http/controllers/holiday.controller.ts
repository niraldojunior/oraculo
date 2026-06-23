import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateHolidayDto, ListHolidaysQueryDto } from '../../../application/dtos/holiday.dto.js';
import { HolidayService } from '../../../application/services/holiday.service.js';
import type { Holiday } from '../../../domain/entities/Holiday.js';

@ApiTags('holidays')
@Controller(['holidays', 'api/holidays'])
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  @ApiOperation({ summary: 'List holidays by optional company' })
  list(@Query() query: ListHolidaysQueryDto): Promise<Holiday[]> {
    return this.holidayService.listHolidays(query.companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create holiday' })
  create(@Body() payload: CreateHolidayDto): Promise<Holiday> {
    return this.holidayService.createHoliday(payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete holiday' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.holidayService.deleteHoliday(id);
    return { message: 'Holiday deleted' };
  }
}
