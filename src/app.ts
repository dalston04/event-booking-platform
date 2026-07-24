import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { pinoHttp } from 'pino-http';
import apiRouter from './routes/index.js';
import { logger } from './utils/logger.js';
import { globalErrorHandler } from './middleware/error.middleware.js';
import { AppError } from './utils/app-error.js';

export function createApp(): Application {
  const app: Application = express();

  // HTTP Request Logger
  app.use(pinoHttp({ logger }));

  // Security Middleware configured for static web assets
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(cors());

  // Static Frontend Asset Serving with No-Cache headers for dev
  app.use(
    express.static(path.join(process.cwd(), 'public'), {
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      },
    }),
  );

  // Body Parsing Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Versioning Base Route
  app.use('/api/v1', apiRouter);

  // 404 Unmapped Route Handler
  app.use((_req: Request, _res: Response, next) => {
    next(AppError.notFound('Requested route does not exist'));
  });

  // Global Centralized Error Handler Middleware
  app.use(globalErrorHandler);

  return app;
}
