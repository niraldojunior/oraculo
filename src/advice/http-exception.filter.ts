import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = isHttpException
      ? exception.getResponse()
      : { message: 'Internal server error' };

    const message =
      typeof payload === 'string'
        ? payload
        : (payload as { message?: string | string[] }).message ?? 'Unexpected error';

    const span = trace.getActiveSpan();
    const spanContext = span?.spanContext();
    const isProduction = process.env.NODE_ENV === 'production';
    const details =
      !isHttpException && !isProduction && exception instanceof Error
        ? exception.message
        : undefined;

    response.status(status).json({
      statusCode: status,
      message,
      ...(details ? { details } : {}),
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
      traceId: spanContext?.traceId
    });
  }
}
