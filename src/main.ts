import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { JsonLoggerService } from './infrastructure/log/logger.service.js';
import { startTelemetry, stopTelemetry } from './infrastructure/telemetry/otel.setup.js';

async function bootstrap() {
  await startTelemetry();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
  });

  const logger = app.get(JsonLoggerService);
  app.useLogger(logger);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Oraculo API')
    .setDescription('REST API com NestJS, DDD, Clean Architecture e observabilidade')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);

  logger.log({ event: 'api_started', port }, 'Bootstrap');
}

void bootstrap();

process.on('SIGTERM', () => {
  void stopTelemetry();
});
