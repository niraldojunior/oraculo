import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { NodeSDK } from '@opentelemetry/sdk-node';

let sdk: NodeSDK | undefined;

export async function startTelemetry(): Promise<void> {
  if (sdk) return;

  if ((process.env.OTEL_LOG_LEVEL ?? '').toLowerCase() === 'debug') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces'
  });

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'oraculo-api',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0'
    }),
    traceExporter: exporter,
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()]
  });

  await sdk.start();
}

export async function stopTelemetry(): Promise<void> {
  if (!sdk) return;
  await sdk.shutdown();
  sdk = undefined;
}
