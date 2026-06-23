import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateSystemDto {
  @ApiProperty()
  @IsString()
  companyId!: string;

  @ApiProperty()
  @IsString()
  departmentId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty()
  @IsString()
  criticality!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerTeamId?: string;

  @ApiProperty()
  @IsString()
  lifecycleStatus!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  debtScore!: number;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  environments?: unknown;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  contextFiles?: unknown[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  technicalSkills?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  responsibleCollaborators?: string[];
}

export class UpdateSystemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  criticality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerTeamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lifecycleStatus?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  debtScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  environments?: unknown;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  contextFiles?: unknown[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  technicalSkills?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  responsibleCollaborators?: string[];
}
