import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ClientTeam } from '../../../domain/entities/ClientTeam.js';
import { ClientTeamService } from '../../../application/services/client-team.service.js';
import { CreateClientTeamDto, UpdateClientTeamDto } from '../../../application/dtos/client-team.dto.js';

@ApiTags('client-teams')
@Controller(['client-teams', 'api/client-teams'])
export class ClientTeamController {
  constructor(private readonly clientTeamService: ClientTeamService) {}

  @Get()
  @ApiOperation({ summary: 'List client teams by optional company/department scope' })
  list(
    @Query('companyId') companyId?: string,
    @Query('departmentId') departmentId?: string
  ): Promise<ClientTeam[]> {
    return this.clientTeamService.listClientTeams({ companyId, departmentId });
  }

  @Post()
  @ApiOperation({ summary: 'Create client team' })
  create(@Body() payload: CreateClientTeamDto): Promise<ClientTeam> {
    return this.clientTeamService.createClientTeam(payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client team' })
  update(@Param('id') id: string, @Body() payload: UpdateClientTeamDto): Promise<ClientTeam> {
    return this.clientTeamService.updateClientTeam(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client team' })
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.clientTeamService.deleteClientTeam(id);
    return { success: true };
  }
}
