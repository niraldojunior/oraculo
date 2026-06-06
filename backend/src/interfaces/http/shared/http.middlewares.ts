import type express from 'express';

export function requestLoggingMiddleware(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}

export function globalErrorHandler(
  err: any,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  console.error('[app.ts] Unhandled error:', err?.stack || err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error', detail: err?.message });
}
