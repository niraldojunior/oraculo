import 'reflect-metadata';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

let cachedServer = null;

async function loadBackend() {
  const [{ AppModule }, { JsonLoggerService }] = await Promise.all([
    import('../dist-api/app.module.js'),
    import('../dist-api/infrastructure/log/logger.service.js')
  ]);

  return { AppModule, JsonLoggerService };
}

async function createServer() {
  if (cachedServer) return cachedServer;

  const { AppModule, JsonLoggerService } = await loadBackend();
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

export default async function handler(req, res) {
  try {
    const server = await createServer();

    await new Promise((resolve, reject) => {
      res.once('finish', resolve);
      res.once('close', resolve);
      server(req, res, error => {
        if (error) reject(error);
      });
    });
  } catch (error) {
    console.error('[vercel-api] request failed', error);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Internal server error' }));
    }
  }
}
