import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'node:http';
import express, { type Express } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module.js';
import { JsonLoggerService } from '../src/infrastructure/log/logger.service.js';
import { startTelemetry } from '../src/infrastructure/telemetry/otel.setup.js';

let cachedServer: Express | null = null;

async function createServer(): Promise<Express> {
  if (cachedServer) return cachedServer;

  await startTelemetry();

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
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

  await app.init();

  cachedServer = server;
  return server;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const server = await createServer();
  server(req, res);
}
