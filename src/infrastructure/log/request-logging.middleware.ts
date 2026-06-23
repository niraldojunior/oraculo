import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { JsonLoggerService } from './logger.service.js';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new JsonLoggerService();

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      this.logger.log(
        {
          event: 'http_request',
          method: req.method,
          path: req.originalUrl || req.url,
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
          contentLength: res.getHeader('content-length')
        },
        RequestLoggingMiddleware.name
      );
    });

    next();
  }
}
