import 'reflect-metadata';

let cachedServer = null;

async function loadBackend() {
  const [
    { default: express },
    { ExpressAdapter },
    { NestFactory },
    { DocumentBuilder, SwaggerModule },
    { AppModule },
    { JsonLoggerService }
  ] = await Promise.all([
    import('express'),
    import('@nestjs/platform-express'),
    import('@nestjs/core'),
    import('@nestjs/swagger'),
    import('../dist-api/app.module.js'),
    import('../dist-api/infrastructure/log/logger.service.js')
  ]);

  return {
    express,
    ExpressAdapter,
    NestFactory,
    DocumentBuilder,
    SwaggerModule,
    AppModule,
    JsonLoggerService
  };
}

async function createServer() {
  if (cachedServer) return cachedServer;

  const {
    express,
    ExpressAdapter,
    NestFactory,
    DocumentBuilder,
    SwaggerModule,
    AppModule,
    JsonLoggerService
  } = await loadBackend();
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
      if (error && typeof error === 'object' && 'code' in error) {
        res.setHeader('X-Oraculo-Error-Code', String(error.code).slice(0, 80));
      }
      res.end(JSON.stringify({ message: 'Internal server error' }));
    }
  }
}
