import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../../../application/dtos/auth.dto.js';
import { AuthService } from '../../../application/services/auth.service.js';
import type { LoginResult } from '../../../domain/entities/Auth.js';

@ApiTags('core')
@Controller(['', 'api'])
export class CoreController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Legacy health endpoint compatibility' })
  health(): { status: string; message: string } {
    return { status: 'OK', message: 'Server is running' };
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Legacy login endpoint compatibility' })
  login(@Body() payload: LoginDto): Promise<LoginResult> {
    return this.authService.login(payload.email, payload.password);
  }
}
