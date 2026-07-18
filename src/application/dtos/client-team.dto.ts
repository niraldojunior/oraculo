import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClientTeamDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @IsString()
  companyId!: string;

  @ApiProperty()
  @IsString()
  departmentId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  businessUnitId?: string | null;
}

export class UpdateClientTeamDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  businessUnitId?: string | null;
}
