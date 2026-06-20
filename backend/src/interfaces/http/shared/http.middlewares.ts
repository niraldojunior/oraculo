import type express from 'express';

let requestSequence = 0;

function nextRequestId() {
  requestSequence += 1;
  return `req-${requestSequence}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function requestLoggingMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const requestId = nextRequestId();
  const start = Date.now();

  console.log(
    `[${nowIso()}] [REQUEST] id=${requestId} method=${req.method} path=${req.originalUrl || req.url}`
  );

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const contentLength = res.getHeader('content-length');
    let sizeInfo = '';
    if (typeof contentLength === 'string' || typeof contentLength === 'number') {
      const lengthNum = Number(contentLength);
      if (!Number.isNaN(lengthNum)) {
        const kb = lengthNum / 1024;
        sizeInfo = ` kb=${kb.toFixed(2)}`;
      }
    }

    console.log(
      `[${nowIso()}] [RESPONSE] id=${requestId} method=${req.method} path=${req.originalUrl || req.url} status=${res.statusCode} durationMs=${durationMs}${sizeInfo}`
    );
  });

  next();
}

export function globalErrorHandler(
  err: any,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  console.error(`[${nowIso()}] [ERROR] Unhandled error:`, err?.stack || err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error', detail: err?.message });
}
