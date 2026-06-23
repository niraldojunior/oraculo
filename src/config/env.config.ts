import { registerAs } from '@nestjs/config';

export const envConfig = registerAs('env', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  dbProvider: (process.env.DB_PROVIDER ?? 'supabase').toLowerCase(),
  otelServiceName: process.env.OTEL_SERVICE_NAME ?? 'oraculo-api',
  otelExporterOtlpEndpoint:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces'
}));
