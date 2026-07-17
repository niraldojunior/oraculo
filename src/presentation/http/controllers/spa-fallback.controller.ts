import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'node:path';

@Controller()
export class SpaFallbackController {
  @Get('*splat')
  serveIndex(@Res() res: Response): void {
    res.sendFile(join(process.cwd(), 'dist', 'index.html'));
  }
}
