import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

@Controller()
export class SpaFallbackController {
  @Get('*splat')
  serveIndex(@Res() res: Response): void {
    const indexPath = join(process.cwd(), 'dist', 'index.html');

    if (!existsSync(indexPath)) {
      res.status(404).json({ statusCode: 404, message: 'Not Found' });
      return;
    }

    res.sendFile(indexPath);
  }
}
