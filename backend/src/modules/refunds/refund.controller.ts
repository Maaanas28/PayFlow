import { Request, Response, NextFunction } from 'express';
import { refundService } from './refund.service';
import { MockPaymentProvider } from '../../providers/mock-payment.provider';

export class RefundController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentIdOrRef = req.params.id;
      const refund = await refundService.createRefund(paymentIdOrRef, req.body);
      res.status(201).json({
        success: true,
        data: refund,
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

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const refund = await refundService.getRefundById(id);
      res.status(200).json({
        success: true,
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }

  async listForPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentIdOrRef = req.params.id;
      const refunds = await refundService.listRefundsForPayment(paymentIdOrRef);
      res.status(200).json({
        success: true,
        data: refunds,
      });
    } catch (error) {
      next(error);
    }
  }

  async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const refunds = await refundService.listRecentRefunds(limit);
      res.status(200).json({
        success: true,
        data: refunds,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const refundController = new RefundController();
