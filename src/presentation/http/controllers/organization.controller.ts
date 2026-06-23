import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Collaborator } from '../../../domain/entities/Collaborator.js';
import type { Team } from '../../../domain/entities/Team.js';
import {
  CreateCollaboratorDto,
  CreateTeamDto,
  ToggleCollaboratorSkillDto,
  UpdateCollaboratorDto,
  UpdateTeamDto
} from '../../../application/dtos/organization.dto.js';
import { OrganizationService } from '../../../application/services/organization.service.js';

@ApiTags('organization')
@Controller(['', 'api'])
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('teams')
  @ApiOperation({ summary: 'List teams by optional company/department scope' })
  listTeams(
    @Query('companyId') companyId?: string,
    @Query('departmentId') departmentId?: string
  ): Promise<Team[]> {
    return this.organizationService.listTeamsByScope({ companyId, departmentId });
  }

  @Post('teams')
  @ApiOperation({ summary: 'Create team' })
  createTeam(@Body() payload: CreateTeamDto): Promise<Team> {
    return this.organizationService.createTeam(payload);
  }

  @Patch('teams/:id')
  @ApiOperation({ summary: 'Update team' })
  updateTeam(@Param('id') id: string, @Body() payload: UpdateTeamDto): Promise<Team> {
    return this.organizationService.updateTeam(id, payload);
  }

  @Delete('teams/:id')
  @ApiOperation({ summary: 'Delete team' })
  async deleteTeam(@Param('id') id: string): Promise<{ message: string }> {
    await this.organizationService.deleteTeam(id);
    return { message: 'Team deleted' };
  }

  @Get('collaborators')
  @ApiOperation({ summary: 'List collaborators by optional company/department scope' })
  listCollaborators(
    @Query('companyId') companyId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('lite') lite?: string
  ): Promise<Collaborator[]> {
    return this.organizationService.listCollaboratorsByScope({
      scope: { companyId, departmentId },
      lite: String(lite ?? 'false').toLowerCase() === 'true'
    });
  }

  @Get('collaborators/email/:email')
  @ApiOperation({ summary: 'Get collaborator by email' })
  getByEmail(@Param('email') email: string): Promise<Collaborator | null> {
    return this.organizationService.findCollaboratorByEmail(email);
  }

  @Post('collaborators')
  @ApiOperation({ summary: 'Create collaborator' })
  createCollaborator(@Body() payload: CreateCollaboratorDto): Promise<Collaborator> {
    return this.organizationService.createCollaborator(payload);
  }

  @Patch('collaborators/:id')
  @ApiOperation({ summary: 'Update collaborator' })
  updateCollaborator(
    @Param('id') id: string,
    @Body() payload: UpdateCollaboratorDto
  ): Promise<Collaborator> {
    return this.organizationService.updateCollaborator(id, payload);
  }

  @Delete('collaborators/:id')
  @ApiOperation({ summary: 'Delete collaborator' })
  async deleteCollaborator(@Param('id') id: string): Promise<{ message: string }> {
    await this.organizationService.deleteCollaborator(id);
    return { message: 'Collaborator deleted' };
  }

  @Post('collaborators/skills/toggle')
  @ApiOperation({ summary: 'Toggle collaborator skill relationship' })
  async toggleCollaboratorSkill(@Body() payload: ToggleCollaboratorSkillDto): Promise<{ success: boolean }> {
    await this.organizationService.toggleCollaboratorSkill(payload);
    return { success: true };
  }
}
