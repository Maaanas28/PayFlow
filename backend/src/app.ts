import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { healthRouter } from './modules/health/health.routes';
import { orderRouter } from './modules/orders/order.routes';
import { paymentRouter } from './modules/payments/payment.routes';
import { paymentRefundRouter, standaloneRefundRouter } from './modules/refunds/refund.routes';
import { ledgerRouter } from './modules/ledger/ledger.routes';
import { webhookRouter } from './modules/webhooks/webhook.routes';
import { errorHandler } from './middleware/error-handler';
import { AppError } from './errors/app-error';
import { config } from './config';

export function createApp(): Express {
  const app = express();

  // Basic Middleware
  const configuredOrigins = config.corsOrigin === '*'
    ? '*'
    : config.corsOrigin
        .split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean);

  const allowedOrigins = configuredOrigins === '*'
    ? '*'
    : Array.from(
        new Set([
          ...configuredOrigins,
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:3000',
        ])
      );

  app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'idempotency-key', 'X-PayFlow-Signature'],
  }));
  app.use(express.json());

  // Mount API v1 Routes
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/orders', orderRouter);
  app.use('/api/v1/payments/:id/refunds', paymentRefundRouter);
  app.use('/api/v1/payments', paymentRouter);
  app.use('/api/v1/refunds', standaloneRefundRouter);
  app.use('/api/v1/ledger', ledgerRouter);
  app.use('/api/v1/webhooks', webhookRouter);

  // 404 Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(AppError.notFound(`Path '${req.method} ${req.path}' not found`, 'ROUTE_NOT_FOUND'));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
