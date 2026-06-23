import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListAbsencesQueryDto {
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
  teamId?: string;
}

export class CreateAbsenceDto {
  @ApiProperty()
  @IsString()
  collaboratorId!: string;

  @ApiProperty()
  @IsString()
  startDate!: string;

  @ApiProperty()
  @IsString()
  endDate!: string;

  @ApiProperty()
  @IsString()
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
