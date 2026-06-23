import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateInitiativeDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty({ enum: ['Backlog', 'In Progress', 'Done'], default: 'Backlog' })
  @IsEnum(['Backlog', 'In Progress', 'Done'])
  status!: 'Backlog' | 'In Progress' | 'Done';

  @ApiProperty({ minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  priority!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class ReprioritizeInitiativeDto {
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  priority!: number;
}
