import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ledgerService } from '../src/modules/ledger/ledger.service';
import { LedgerAccountType, LedgerEntryDirection } from '../src/types';
import { AppError } from '../src/errors/app-error';

describe('Double-Entry Ledger Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects ledger transaction with fewer than two entries', async () => {
    await expect(
      ledgerService.postTransaction({
        referenceType: 'PAYMENT_CAPTURE',
        referenceId: 'ref_single',
        description: 'Invalid single entry',
        entries: [
          {
            accountType: LedgerAccountType.CUSTOMER_FUNDS,
            direction: LedgerEntryDirection.DEBIT,
            amountMinor: 50000,
          },
        ],
      })
    ).rejects.toThrow(AppError);
  });

  it('rejects ledger transaction with negative or non-integer amounts', async () => {
    await expect(
      ledgerService.postTransaction({
        referenceType: 'PAYMENT_CAPTURE',
        referenceId: 'ref_invalid_amount',
        description: 'Negative amount',
        entries: [
          {
            accountType: LedgerAccountType.CUSTOMER_FUNDS,
            direction: LedgerEntryDirection.DEBIT,
            amountMinor: -100,
          },
          {
            accountType: LedgerAccountType.MERCHANT_SETTLEMENT,
            direction: LedgerEntryDirection.CREDIT,
            amountMinor: -100,
          },
        ],
      })
    ).rejects.toThrow(AppError);
  });

  it('rejects unbalanced ledger transaction where debits do not equal credits', async () => {
    await expect(
      ledgerService.postTransaction({
        referenceType: 'PAYMENT_CAPTURE',
        referenceId: 'ref_unbalanced',
        description: 'Unbalanced transaction',
        entries: [
          {
            accountType: LedgerAccountType.CUSTOMER_FUNDS,
            direction: LedgerEntryDirection.DEBIT,
            amountMinor: 99900,
          },
          {
            accountType: LedgerAccountType.MERCHANT_SETTLEMENT,
            direction: LedgerEntryDirection.CREDIT,
            amountMinor: 89900, // Missing 10000 paise
          },
        ],
      })
    ).rejects.toThrow(AppError);
  });

  it('validates a balanced transaction structure', async () => {
    const mockClient: any = {
      ledgerTransaction: {
        create: vi.fn().mockResolvedValue({
          id: 'ltx_123',
          referenceType: 'PAYMENT_CAPTURE',
          referenceId: 'pay_123',
          description: 'Payment capture settlement',
          entries: [
            {
              id: 'le_1',
              accountType: LedgerAccountType.CUSTOMER_FUNDS,
              direction: LedgerEntryDirection.DEBIT,
              amountMinor: 99900,
            },
            {
              id: 'le_2',
              accountType: LedgerAccountType.MERCHANT_SETTLEMENT,
              direction: LedgerEntryDirection.CREDIT,
              amountMinor: 99900,
            },
          ],
        }),
      },
    };

    const res = await ledgerService.recordPaymentCapture(
      'pay_123',
      99900,
      'INR',
      mockClient
    );

    expect(res.id).toBe('ltx_123');
    expect(mockClient.ledgerTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          referenceType: 'PAYMENT_CAPTURE',
          referenceId: 'pay_123',
          entries: {
            create: [
              expect.objectContaining({ direction: 'DEBIT', amountMinor: 99900 }),
              expect.objectContaining({ direction: 'CREDIT', amountMinor: 99900 }),
            ],
          },
        }),
      })
    );
  });

  it('handles duplicate ledger transaction error via P2002 conflict', async () => {
    const p2002Error: any = new Error('Unique constraint failed');
    p2002Error.code = 'P2002';

    const mockClient: any = {
      ledgerTransaction: {
        create: vi.fn().mockRejectedValue(p2002Error),
      },
    };

    await expect(
      ledgerService.recordPaymentCapture('pay_duplicate', 99900, 'INR', mockClient)
    ).rejects.toThrow(AppError);
  });
});
