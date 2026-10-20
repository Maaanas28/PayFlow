import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/app-error';
import {
  LedgerAccountType,
  LedgerEntryDirection,
  LedgerTransaction,
} from '../../types';

export interface PostLedgerEntryParams {
  accountType: LedgerAccountType;
  direction: LedgerEntryDirection;
  amountMinor: number;
  currency?: string;
}

export interface PostLedgerTransactionParams {
  referenceType: string;
  referenceId: string;
  description: string;
  entries: PostLedgerEntryParams[];
}

export class LedgerService {
  /**
   * Posts an immutable, balanced double-entry ledger transaction.
   * Enforces that total debits equal total credits and all amounts are positive integers.
   */
  async postTransaction(
    params: PostLedgerTransactionParams,
    client: any = prisma
  ): Promise<LedgerTransaction> {
    if (!params.entries || params.entries.length < 2) {
      throw AppError.badRequest(
        'A ledger transaction requires at least two balanced entries',
        'INVALID_LEDGER_ENTRY_COUNT'
      );
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of params.entries) {
      if (!Number.isInteger(entry.amountMinor) || entry.amountMinor <= 0) {
        throw AppError.badRequest(
          `Ledger amounts must be positive integers in minor units (paise). Received: ${entry.amountMinor}`,
          'INVALID_LEDGER_AMOUNT'
        );
      }

      if (entry.direction === LedgerEntryDirection.DEBIT) {
        totalDebits += entry.amountMinor;
      } else if (entry.direction === LedgerEntryDirection.CREDIT) {
        totalCredits += entry.amountMinor;
      } else {
        throw AppError.badRequest(
          `Invalid ledger direction: ${entry.direction}`,
          'INVALID_LEDGER_DIRECTION'
        );
      }
    }

    // Mathematical invariant: Total debits must equal total credits
    if (totalDebits !== totalCredits) {
      throw AppError.badRequest(
        `Ledger transaction does not balance. Total Debits: ${totalDebits}, Total Credits: ${totalCredits}`,
        'UNBALANCED_LEDGER_TRANSACTION',
        { totalDebits, totalCredits }
      );
    }

    try {
      const transaction = await client.ledgerTransaction.create({
        data: {
          referenceType: params.referenceType,
          referenceId: params.referenceId,
          description: params.description,
          entries: {
            create: params.entries.map((e) => ({
              accountType: e.accountType,
              direction: e.direction,
              amountMinor: e.amountMinor,
              currency: e.currency || 'INR',
            })),
          },
        },
        include: {
          entries: true,
        },
      });

      return transaction;
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw AppError.conflict(
          `Ledger transaction for ${params.referenceType} '${params.referenceId}' has already been posted`,
          'DUPLICATE_LEDGER_TRANSACTION'
        );
      }
      throw err;
    }
  }

  /**
   * Posts standard balanced capture entries when a payment is captured.
   * Debits Customer Inbound Funds, Credits Merchant Settlement Account.
   */
  async recordPaymentCapture(
    paymentAttemptId: string,
    amountMinor: number,
    currency = 'INR',
    client: any = prisma
  ): Promise<LedgerTransaction> {
    return this.postTransaction(
      {
        referenceType: 'PAYMENT_CAPTURE',
        referenceId: paymentAttemptId,
        description: `Payment capture settlement for attempt ${paymentAttemptId}`,
        entries: [
          {
            accountType: LedgerAccountType.CUSTOMER_FUNDS,
            direction: LedgerEntryDirection.DEBIT,
            amountMinor,
            currency,
          },
          {
            accountType: LedgerAccountType.MERCHANT_SETTLEMENT,
            direction: LedgerEntryDirection.CREDIT,
            amountMinor,
            currency,
          },
        ],
      },
      client
    );
  }

  /**
   * Posts standard balanced refund entries.
   * Debits Merchant Settlement Account, Credits Customer Refund Funds.
   */
  async recordRefund(
    refundId: string,
    amountMinor: number,
    currency = 'INR',
    client: any = prisma
  ): Promise<LedgerTransaction> {
    return this.postTransaction(
      {
        referenceType: 'REFUND',
        referenceId: refundId,
        description: `Refund reversal for refund ${refundId}`,
        entries: [
          {
            accountType: LedgerAccountType.MERCHANT_SETTLEMENT,
            direction: LedgerEntryDirection.DEBIT,
            amountMinor,
            currency,
          },
          {
            accountType: LedgerAccountType.CUSTOMER_FUNDS,
            direction: LedgerEntryDirection.CREDIT,
            amountMinor,
            currency,
          },
        ],
      },
      client
    );
  }

  async listTransactions(limit = 50) {
    return prisma.ledgerTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: {
        entries: true,
      },
    });
  }

  async getTransactionByReference(referenceType: string, referenceId: string) {
    return prisma.ledgerTransaction.findUnique({
      where: {
        referenceType_referenceId: {
          referenceType,
          referenceId,
        },
      },
      include: {
        entries: true,
      },
    });
  }
}

export const ledgerService = new LedgerService();
