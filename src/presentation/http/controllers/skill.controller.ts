import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Skill } from '../../../domain/entities/Skill.js';
import { SkillService } from '../../../application/services/skill.service.js';
import { CreateSkillDto, UpdateSkillDto } from '../../../application/dtos/skill.dto.js';

@ApiTags('skills')
@Controller(['skills', 'api/skills'])
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Get()
  @ApiOperation({ summary: 'List skills by optional company/department scope' })
  list(
    @Query('companyId') companyId?: string,
    @Query('departmentId') departmentId?: string
  ): Promise<Skill[]> {
    return this.skillService.listSkills({ companyId, departmentId });
  }

  @Post()
  @ApiOperation({ summary: 'Create skill' })
  create(@Body() payload: CreateSkillDto): Promise<Skill> {
    const { memberIds, ...skillData } = payload;
    return this.skillService.createSkill(skillData, memberIds);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update skill' })
  update(@Param('id') id: string, @Body() payload: UpdateSkillDto): Promise<Skill> {
    const { memberIds, ...skillData } = payload;
    return this.skillService.updateSkill(id, skillData, memberIds);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete skill' })
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.skillService.deleteSkill(id);
    return { success: true };
  }
}
