import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  type!: string;

  @ApiProperty()
  @IsString()
  companyId!: string;

  @ApiProperty()
  @IsString()
  departmentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentTeamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leaderId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  receivesInitiatives?: boolean;
}

export class UpdateTeamDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

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
  parentTeamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leaderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  receivesInitiatives?: boolean;
}

export class CreateCollaboratorDto {
  @ApiProperty()
  @IsString()
  companyId!: string;

  @ApiProperty()
  @IsString()
  departmentId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  role!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  squadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  githubUrl?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  associatedCompanyIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vacationStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  birthday?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uf?: string;
}

export class UpdateCollaboratorDto {
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
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  squadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  githubUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  associatedCompanyIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vacationStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  birthday?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uf?: string;
}

export class ToggleCollaboratorSkillDto {
  @ApiProperty()
  @IsString()
  collaboratorId!: string;

  @ApiProperty()
  @IsString()
  skillId!: string;

  @ApiProperty()
  @IsBoolean()
  active!: boolean;
}
