import 'reflect-metadata';
import express, { type Express } from 'express';
import type { Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../../app.module.js';
import { JsonLoggerService } from '../../infrastructure/log/logger.service.js';
import { startTelemetry } from '../../infrastructure/telemetry/otel.setup.js';

let cachedApp: Express | null = null;

async function getApp(): Promise<Express> {
  if (cachedApp) return cachedApp;

  await startTelemetry();

  const expressApp = express();
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    bufferLogs: true
  });

  const logger = nestApp.get(JsonLoggerService);
  nestApp.useLogger(logger);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Oraculo API')
    .setDescription('REST API com NestJS, DDD, Clean Architecture e observabilidade')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(nestApp, swaggerConfig);
  SwaggerModule.setup('api/docs', nestApp, document);

  await nestApp.init();
  cachedApp = expressApp;
  return expressApp;
}

export default async function serverlessHandler(req: Request, res: Response): Promise<void> {
  const app = await getApp();
  app(req, res);
}
