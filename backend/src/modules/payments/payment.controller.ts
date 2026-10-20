import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { MockPaymentProvider } from '../../providers/mock-payment.provider';

export class PaymentController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idempotencyKey =
        (req.header('Idempotency-Key') || req.header('idempotency-key'))?.trim();

      const { isReplay, payment } = await paymentService.createPayment(req.body, idempotencyKey);

      if (isReplay) {
        res.setHeader('Idempotent-Replay', 'true');
      }

      res.status(201).json({
        success: true,
        data: payment,
        meta: {
          isSimulation: true,
          isReplay,
          disclaimer: MockPaymentProvider.DISCLAIMER,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async reconcile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await paymentService.reconcilePayment(id, req.body);
      res.status(200).json({
        success: true,
        data: payment,
        meta: {
          isSimulation: true,
          disclaimer: MockPaymentProvider.DISCLAIMER,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const payments = await paymentService.listPayments(limit);
      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await paymentService.getPaymentById(id);
      res.status(200).json({
        success: true,
        data: payment,
        meta: {
          isSimulation: true,
          disclaimer: MockPaymentProvider.DISCLAIMER,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
