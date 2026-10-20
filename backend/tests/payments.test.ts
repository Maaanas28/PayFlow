import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/db/prisma';

vi.mock('../src/db/prisma', () => {
  return {
    prisma: {
      order: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      paymentAttempt: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      idempotencyRecord: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      ledgerTransaction: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      webhookEvent: {
        create: vi.fn(),
      },
    },
  };
});

describe('Payment Processing & Retrieval Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleOrder = {
    id: 'ord_123',
    productId: 'prod_sample_001',
    productName: 'PayFlow Developer Sandbox Pass',
    quantity: 1,
    unitPriceMinor: 99900,
    totalPriceMinor: 99900,
    currency: 'INR',
    status: 'CREATED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('POST /api/v1/payments', () => {
    it('returns 400 when Idempotency-Key header is missing', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .send({
          orderId: 'ord_123',
          simulatedOutcome: 'SUCCESS',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
    });

    it('successfully processes a simulated SUCCESS payment attempt', async () => {
      vi.mocked(prisma.idempotencyRecord.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(sampleOrder as any);
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.idempotencyRecord.create).mockResolvedValue({} as any);

      const createdAttempt = {
        id: 'att_001',
        paymentReference: 'pay_123456',
        orderId: 'ord_123',
        amountMinor: 99900,
        currency: 'INR',
        status: 'CREATED',
        provider: 'MOCK_SANDBOX',
        simulatedOutcome: 'SUCCESS',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.paymentAttempt.create).mockResolvedValue(createdAttempt as any);

      const processingAttempt = { ...createdAttempt, status: 'PROCESSING' };
      const succeededAttempt = {
        ...processingAttempt,
        status: 'SUCCEEDED',
        order: { ...sampleOrder, status: 'COMPLETED' },
      };

      vi.mocked(prisma.paymentAttempt.update)
        .mockResolvedValueOnce(processingAttempt as any)
        .mockResolvedValueOnce(succeededAttempt as any);

      vi.mocked(prisma.order.update).mockResolvedValue({
        ...sampleOrder,
        status: 'COMPLETED',
      } as any);

      vi.mocked(prisma.paymentAttempt.findUnique).mockResolvedValue(succeededAttempt as any);
      vi.mocked(prisma.idempotencyRecord.update).mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Idempotency-Key', 'key_test_001')
        .send({
          orderId: 'ord_123',
          simulatedOutcome: 'SUCCESS',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUCCEEDED');
      expect(res.body.data.amountMinor).toBe(99900);
      expect(res.body.meta.isSimulation).toBe(true);
      expect(res.body.meta.disclaimer).toMatch(/Sandbox only/);

      // Verify DB updates
      expect(prisma.paymentAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'att_001' },
          data: { status: 'SUCCEEDED' },
        })
      );
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_123' },
          data: { status: 'COMPLETED' },
        })
      );
    });

    it('processes a simulated DECLINE payment attempt', async () => {
      vi.mocked(prisma.idempotencyRecord.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(sampleOrder as any);
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.idempotencyRecord.create).mockResolvedValue({} as any);

      const createdAttempt = {
        id: 'att_002',
        paymentReference: 'pay_654321',
        orderId: 'ord_123',
        amountMinor: 99900,
        currency: 'INR',
        status: 'CREATED',
        provider: 'MOCK_SANDBOX',
        simulatedOutcome: 'DECLINE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.paymentAttempt.create).mockResolvedValue(createdAttempt as any);

      const processingAttempt = { ...createdAttempt, status: 'PROCESSING' };
      const failedAttempt = {
        ...processingAttempt,
        status: 'FAILED',
        failureReason: 'CARD_DECLINED_INSUFFICIENT_FUNDS',
        order: { ...sampleOrder, status: 'FAILED' },
      };

      vi.mocked(prisma.paymentAttempt.update)
        .mockResolvedValueOnce(processingAttempt as any)
        .mockResolvedValueOnce(failedAttempt as any);

      vi.mocked(prisma.order.update).mockResolvedValue({
        ...sampleOrder,
        status: 'FAILED',
      } as any);

      vi.mocked(prisma.paymentAttempt.findUnique).mockResolvedValue(failedAttempt as any);
      vi.mocked(prisma.idempotencyRecord.update).mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Idempotency-Key', 'key_test_002')
        .send({
          orderId: 'ord_123',
          simulatedOutcome: 'DECLINE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('FAILED');
      expect(res.body.data.failureReason).toBe('CARD_DECLINED_INSUFFICIENT_FUNDS');

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_123' },
          data: { status: 'FAILED' },
        })
      );
    });

    it('returns 404 when attempting to pay for a non-existent order', async () => {
      vi.mocked(prisma.idempotencyRecord.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Idempotency-Key', 'key_test_003')
        .send({
          orderId: 'ord_ghost',
          simulatedOutcome: 'SUCCESS',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
    });

    it('returns 409 conflict when order is already COMPLETED', async () => {
      vi.mocked(prisma.idempotencyRecord.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...sampleOrder,
        status: 'COMPLETED',
      } as any);

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Idempotency-Key', 'key_test_004')
        .send({
          orderId: 'ord_123',
          simulatedOutcome: 'SUCCESS',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ORDER_ALREADY_PAID');
    });

    it('returns 400 validation error when orderId is missing', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .set('Idempotency-Key', 'key_test_005')
        .send({
          simulatedOutcome: 'SUCCESS',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 validation error when simulatedOutcome is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .set('Idempotency-Key', 'key_test_006')
        .send({
          orderId: 'ord_123',
          simulatedOutcome: 'INVALID_CHOICE',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/payments/:id', () => {
    it('retrieves an existing payment attempt by ID or reference', async () => {
      const existingPayment = {
        id: 'att_001',
        paymentReference: 'pay_123456',
        orderId: 'ord_123',
        amountMinor: 99900,
        currency: 'INR',
        status: 'SUCCEEDED',
        provider: 'MOCK_SANDBOX',
        simulatedOutcome: 'SUCCESS',
        order: sampleOrder,
      };

      vi.mocked(prisma.paymentAttempt.findFirst).mockResolvedValue(existingPayment as any);

      const res = await request(app).get('/api/v1/payments/att_001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('att_001');
      expect(res.body.data.paymentReference).toBe('pay_123456');
      expect(res.body.data.order.id).toBe('ord_123');
    });

    it('returns 404 when payment ID does not exist', async () => {
      vi.mocked(prisma.paymentAttempt.findFirst).mockResolvedValue(null);

      const res = await request(app).get('/api/v1/payments/att_unknown');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PAYMENT_NOT_FOUND');
    });
  });
});
