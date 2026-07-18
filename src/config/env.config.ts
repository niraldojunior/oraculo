import { registerAs } from '@nestjs/config';

export function resolveDbProvider(): string {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  if (nodeEnv === 'production') {
    return 'supabase';
  }

  return (process.env.DB_PROVIDER ?? 'oracle').toLowerCase();
}

export const envConfig = registerAs('env', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  dbProvider: resolveDbProvider(),
  otelServiceName: process.env.OTEL_SERVICE_NAME ?? 'oraculo-api',
  otelExporterOtlpEndpoint:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces'
}));
