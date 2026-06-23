import { Injectable, LoggerService } from '@nestjs/common';
import pino, { type Logger } from 'pino';
import { trace } from '@opentelemetry/api';

@Injectable()
export class JsonLoggerService implements LoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = pino({
      base: {
        service: process.env.OTEL_SERVICE_NAME ?? 'oraculo-api'
      },
      timestamp: pino.stdTimeFunctions.isoTime
    });
  }

  log(message: unknown, context?: string): void {
    this.logger.info(this.buildPayload(message, context));
  }

  error(message: unknown, traceText?: string, context?: string): void {
    this.logger.error(this.buildPayload(message, context, traceText));
  }

  warn(message: unknown, context?: string): void {
    this.logger.warn(this.buildPayload(message, context));
  }

  debug(message: unknown, context?: string): void {
    this.logger.debug(this.buildPayload(message, context));
  }

  verbose(message: unknown, context?: string): void {
    this.logger.trace(this.buildPayload(message, context));
  }

  private buildPayload(message: unknown, context?: string, stack?: string) {
    const span = trace.getActiveSpan();
    const spanContext = span?.spanContext();

    return {
      message,
      context,
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
      stack
    };
  }
}
