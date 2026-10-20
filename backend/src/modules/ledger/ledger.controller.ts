import { Request, Response, NextFunction } from 'express';
import { ledgerService } from './ledger.service';
import { AppError } from '../../errors/app-error';

export class LedgerController {
  async getByReference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { referenceType, referenceId } = req.params;
      const transaction = await ledgerService.getTransactionByReference(referenceType, referenceId);
      if (!transaction) {
        throw AppError.notFound(
          `Ledger transaction for ${referenceType} '${referenceId}' not found`,
          'LEDGER_TRANSACTION_NOT_FOUND'
        );
      }

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async getForPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await ledgerService.getTransactionByReference('PAYMENT_CAPTURE', id);
      if (!transaction) {
        throw AppError.notFound(
          `Ledger transaction for payment '${id}' not found`,
          'LEDGER_TRANSACTION_NOT_FOUND'
        );
      }

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const transactions = await ledgerService.listTransactions(limit);
      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ledgerController = new LedgerController();
