import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { INITIATIVE_STATUSES } from '../../domain/entities/Initiative.js';
import type { InitiativeStatus } from '../../domain/entities/Initiative.js';

/**
 * Payload de criação de iniciativa.
 *
 * Como o `ValidationPipe` global roda com `whitelist: true`, todo campo que a UI
 * envia e não estiver declarado aqui é descartado silenciosamente antes de
 * chegar ao service — então este DTO precisa cobrir o formulário inteiro do
 * `CreateInitiativeModal`, não só o mínimo obrigatório.
 */
export class CreateInitiativeDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty({ enum: INITIATIVE_STATUSES, default: '1- Backlog' })
  @IsEnum(INITIATIVE_STATUSES)
  status!: InitiativeStatus;

  @ApiPropertyOptional({ minimum: 0, default: 0, description: 'Posição na fila; 0 quando omitido' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ nullable: true, description: 'FK da área cliente demandante (D11)' })
  @IsOptional()
  @IsString()
  clientTeamId?: string | null;

  @ApiPropertyOptional({ deprecated: true, description: 'Legacy alias; use clientTeamId' })
  @IsOptional()
  @IsString()
  originDirectorate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  benefit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  benefitType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerOwner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leaderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technicalLeadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdById?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedManagerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  initiativeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rationale?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requestDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessExpectationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  impactedSystemIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  macroScope?: string[];
}

export class ReprioritizeInitiativeDto {
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  priority!: number;
}
