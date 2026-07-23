import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Initiative } from '../../../domain/entities/Initiative.js';
import type { InitiativeComment } from '../../../domain/repositories/InitiativeCommentRepository.js';
import { CreateInitiativeDto, ReprioritizeInitiativeDto } from '../../../application/dtos/initiative.dto.js';
import { CreateInitiativeCommentDto, UpdateInitiativeCommentDto } from '../../../application/dtos/initiative-comment.dto.js';
import { InitiativeService } from '../../../application/services/initiative.service.js';
import { InitiativeCommentService } from '../../../application/services/initiative-comment.service.js';

@ApiTags('initiatives')
@Controller(['initiatives', 'api/initiatives'])
export class InitiativeController {
  constructor(
    private readonly initiativeService: InitiativeService,
    private readonly commentService: InitiativeCommentService
  ) {}

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

  @Patch(':id')
  @ApiOperation({ summary: 'Update initiative by id' })
  update(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>
  ): Promise<Initiative> {
    return this.initiativeService.update(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete initiative by id' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.initiativeService.delete(id);
    return { message: 'Initiative deleted' };
  }

  @Patch(':id/priority')
  @ApiOperation({ summary: 'Reprioritize initiative' })
  reprioritize(
    @Param('id') id: string,
    @Body() payload: ReprioritizeInitiativeDto
  ): Promise<Initiative> {
    return this.initiativeService.reprioritize(id, payload.priority);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments for an initiative' })
  getComments(@Param('id') id: string): Promise<InitiativeComment[]> {
    return this.commentService.listByInitiativeId(id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Create a comment on an initiative' })
  createComment(
    @Param('id') id: string,
    @Body() payload: CreateInitiativeCommentDto
  ): Promise<InitiativeComment> {
    return this.commentService.create(id, payload);
  }

  @Patch(':id/comments/:commentId')
  @ApiOperation({ summary: 'Update a comment' })
  updateComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() payload: UpdateInitiativeCommentDto
  ): Promise<InitiativeComment> {
    return this.commentService.update(commentId, payload);
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string
  ): Promise<{ message: string }> {
    await this.commentService.delete(commentId);
    return { message: 'Comment deleted' };
  }
}
