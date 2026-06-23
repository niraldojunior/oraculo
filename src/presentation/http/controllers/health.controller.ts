import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { trace } from '@opentelemetry/api';
import { DatabaseHealthIndicator } from '../modules/database.health.indicator.js';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly databaseHealthIndicator: DatabaseHealthIndicator
  ) {}

  @Get('healthz')
  @ApiOperation({ summary: 'Custom health check endpoint' })
  @HealthCheck()
  async healthz() {
    const span = trace.getActiveSpan();
    const spanContext = span?.spanContext();
    const health = await this.healthCheckService.check([
      async () => this.databaseHealthIndicator.isHealthy('database')
    ]);

    return {
      ...health,
      service: process.env.OTEL_SERVICE_NAME ?? 'oraculo-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      traceId: spanContext?.traceId
    };
  }
}
