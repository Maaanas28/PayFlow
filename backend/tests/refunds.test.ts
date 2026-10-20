import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/db/prisma';

vi.mock('../src/db/prisma', () => {
  return {
    prisma: {
      $transaction: vi.fn((callback) => callback(prisma)),
      $queryRaw: vi.fn(),
      paymentAttempt: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      refund: {
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
      },
      ledgerTransaction: {
        create: vi.fn(),
      },
      webhookEvent: {
        create: vi.fn(),
      },
    },
  };
});

describe('Refunds Endpoints & Validation Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const capturedPayment = {
    id: 'pay_captured_001',
    paymentReference: 'pay_ref_captured_001',
    orderId: 'ord_123',
    amountMinor: 99900,
    currency: 'INR',
    status: 'SUCCEEDED',
    refunds: [],
  };

  describe('POST /api/v1/payments/:id/refunds', () => {
    it('creates a full refund when amountMinor is omitted', async () => {
      vi.mocked(prisma.paymentAttempt.findFirst).mockResolvedValue(capturedPayment as any);
      vi.mocked(prisma.refund.findMany).mockResolvedValue([]);

      const createdRefund = {
        id: 'ref_001',
        refundReference: 'ref_auto_001',
        paymentAttemptId: 'pay_captured_001',
        amountMinor: 99900,
        currency: 'INR',
        status: 'SUCCEEDED',
        reason: 'Requested by customer/merchant',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.refund.create).mockResolvedValue(createdRefund as any);
      vi.mocked(prisma.ledgerTransaction.create).mockResolvedValue({} as any);
      vi.mocked(prisma.webhookEvent.create).mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/payments/pay_captured_001/refunds')
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amountMinor).toBe(99900);
      expect(prisma.refund.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amountMinor: 99900,
            status: 'SUCCEEDED',
          }),
        })
      );
    });

    it('creates a partial refund successfully', async () => {
      vi.mocked(prisma.paymentAttempt.findFirst).mockResolvedValue(capturedPayment as any);
      vi.mocked(prisma.refund.findMany).mockResolvedValue([]);

      const partialRefund = {
        id: 'ref_002',
        refundReference: 'ref_partial_002',
        paymentAttemptId: 'pay_captured_001',
        amountMinor: 40000,
        currency: 'INR',
        status: 'SUCCEEDED',
        reason: 'Item returned partially',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.refund.create).mockResolvedValue(partialRefund as any);
      vi.mocked(prisma.ledgerTransaction.create).mockResolvedValue({} as any);
      vi.mocked(prisma.webhookEvent.create).mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/payments/pay_captured_001/refunds')
        .send({
          amountMinor: 40000,
          reason: 'Item returned partially',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amountMinor).toBe(40000);
    });

    it('rejects refund if payment status is not SUCCEEDED (400)', async () => {
      vi.mocked(prisma.paymentAttempt.findFirst).mockResolvedValue({
        ...capturedPayment,
        status: 'FAILED',
      } as any);

      const res = await request(app)
        .post('/api/v1/payments/pay_captured_001/refunds')
        .send({ amountMinor: 10000 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_PAYMENT_STATUS_FOR_REFUND');
    });

    it('rejects refund if requested amount exceeds captured amount (400 EXCEEDS_REFUNDABLE_BALANCE)', async () => {
      vi.mocked(prisma.paymentAttempt.findFirst).mockResolvedValue(capturedPayment as any);
      vi.mocked(prisma.refund.findMany).mockResolvedValue([]);

      const res = await request(app)
        .post('/api/v1/payments/pay_captured_001/refunds')
        .send({ amountMinor: 150000 }); // Exceeds 99900

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EXCEEDS_REFUNDABLE_BALANCE');
    });

    it('rejects refund if cumulative refunds exceed refundable balance', async () => {
      vi.mocked(prisma.paymentAttempt.findFirst).mockResolvedValue(capturedPayment as any);
      // Already refunded 70000 paise out of 99900
      vi.mocked(prisma.refund.findMany).mockResolvedValue([
        { id: 'ref_prior_1', amountMinor: 70000, status: 'SUCCEEDED' } as any,
      ]);

      // Requesting 35000 paise (remaining is only 29900)
      const res = await request(app)
        .post('/api/v1/payments/pay_captured_001/refunds')
        .send({ amountMinor: 35000 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EXCEEDS_REFUNDABLE_BALANCE');
    });

    it('rejects refund if payment is already fully refunded', async () => {
      vi.mocked(prisma.paymentAttempt.findFirst).mockResolvedValue(capturedPayment as any);
      vi.mocked(prisma.refund.findMany).mockResolvedValue([
        { id: 'ref_prior_1', amountMinor: 99900, status: 'SUCCEEDED' } as any,
      ]);

      const res = await request(app)
        .post('/api/v1/payments/pay_captured_001/refunds')
        .send({ amountMinor: 1000 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ALREADY_FULLY_REFUNDED');
    });
  });

  describe('GET /api/v1/refunds/:id', () => {
    it('retrieves an existing refund by ID or reference', async () => {
      const mockRefund = {
        id: 'ref_001',
        refundReference: 'ref_test_001',
        paymentAttemptId: 'pay_123',
        amountMinor: 50000,
        currency: 'INR',
        status: 'SUCCEEDED',
      };
      vi.mocked(prisma.refund.findFirst).mockResolvedValue(mockRefund as any);

      const res = await request(app).get('/api/v1/refunds/ref_001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('ref_001');
    });

    it('returns 404 when refund ID does not exist', async () => {
      vi.mocked(prisma.refund.findFirst).mockResolvedValue(null);

      const res = await request(app).get('/api/v1/refunds/ref_unknown');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REFUND_NOT_FOUND');
    });
  });
});
