import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/db/prisma';
import { computeRequestHash } from '../src/utils/idempotency';

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

describe('Payment Reliability & Idempotency Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleOrder = {
    id: 'ord_idem_123',
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

  const samplePayment = {
    id: 'pay_attempt_123',
    paymentReference: 'pay_ref_123',
    orderId: 'ord_idem_123',
    amountMinor: 99900,
    currency: 'INR',
    status: 'SUCCEEDED',
    provider: 'MOCK_SANDBOX',
    simulatedOutcome: 'SUCCESS',
    failureReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: { ...sampleOrder, status: 'COMPLETED' },
  };

  describe('Idempotency-Key Header Enforcement', () => {
    it('rejects payment creation if Idempotency-Key header is missing (400)', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .send({
          orderId: 'ord_idem_123',
          simulatedOutcome: 'SUCCESS',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
      expect(prisma.paymentAttempt.create).not.toHaveBeenCalled();
    });
  });

  describe('Identical Repeated Requests (Replay Behavior)', () => {
    it('returns original result with Idempotent-Replay header without creating duplicate payment', async () => {
      const payload = {
        orderId: 'ord_idem_123',
        simulatedOutcome: 'SUCCESS' as const,
      };
      const key = 'idem_key_unique_001';
      const hash = computeRequestHash(payload);

      // Mock that an existing RESOLVED idempotency record exists
      vi.mocked(prisma.idempotencyRecord.findUnique).mockResolvedValue({
        id: 'rec_001',
        key,
        orderId: 'ord_idem_123',
        requestHash: hash,
        statusCode: 201,
        responseBody: samplePayment as any,
        status: 'RESOLVED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Idempotency-Key', key)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.headers['idempotent-replay']).toBe('true');
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('pay_attempt_123');
      expect(res.body.meta.isReplay).toBe(true);

      // Verify no new payment or DB mutation was executed
      expect(prisma.paymentAttempt.create).not.toHaveBeenCalled();
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('Same Key with Different Payload', () => {
    it('returns HTTP 409 Conflict when reusing key with different payload', async () => {
      const originalPayload = {
        orderId: 'ord_idem_123',
        simulatedOutcome: 'SUCCESS',
      };
      const originalHash = computeRequestHash(originalPayload);
      const key = 'idem_key_tamper_001';

      vi.mocked(prisma.idempotencyRecord.findUnique).mockResolvedValue({
        id: 'rec_002',
        key,
        orderId: 'ord_idem_123',
        requestHash: originalHash,
        statusCode: 201,
        responseBody: samplePayment as any,
        status: 'RESOLVED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Different payload: simulatedOutcome is 'DECLINE' instead of 'SUCCESS'
      const differentPayload = {
        orderId: 'ord_idem_123',
        simulatedOutcome: 'DECLINE',
      };

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Idempotency-Key', key)
        .send(differentPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');
      expect(prisma.paymentAttempt.create).not.toHaveBeenCalled();
    });
  });

  describe('Concurrent Requests Using the Same Key', () => {
    it('returns 409 Conflict when another request with the key is in PROCESSING status', async () => {
      const payload = {
        orderId: 'ord_idem_123',
        simulatedOutcome: 'SUCCESS',
      };
      const key = 'idem_key_concurrent_001';
      const hash = computeRequestHash(payload);

      vi.mocked(prisma.idempotencyRecord.findUnique).mockResolvedValue({
        id: 'rec_003',
        key,
        orderId: 'ord_idem_123',
        requestHash: hash,
        statusCode: null,
        responseBody: null,
        status: 'PROCESSING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Idempotency-Key', key)
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONCURRENT_IDEMPOTENCY_REQUEST');
    });

    it('returns 409 Conflict if database throws unique constraint violation (P2002)', async () => {
      const payload = {
        orderId: 'ord_idem_123',
        simulatedOutcome: 'SUCCESS',
      };
      const key = 'idem_key_race_001';

      vi.mocked(prisma.idempotencyRecord.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(sampleOrder as any);
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });

      const p2002Error: any = new Error('Unique constraint failed on key');
      p2002Error.code = 'P2002';
      vi.mocked(prisma.idempotencyRecord.create).mockRejectedValue(p2002Error);
      vi.mocked(prisma.order.update).mockResolvedValue(sampleOrder as any);

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Idempotency-Key', key)
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONCURRENT_IDEMPOTENCY_REQUEST');
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_idem_123' },
          data: { status: 'CREATED' },
        })
      );
    });
  });

  describe('Concurrent Attempts Against the Same Order', () => {
    it('prevents multiple concurrent payments from charging the same order (409)', async () => {
      const payload = {
        orderId: 'ord_idem_123',
        simulatedOutcome: 'SUCCESS',
      };
      const key = 'idem_key_order_conflict_001';

      vi.mocked(prisma.idempotencyRecord.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(sampleOrder as any);
      // Another process has already updated order status to PROCESSING!
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 0 });

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Idempotency-Key', key)
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONCURRENT_PAYMENT_CONFLICT');
      expect(prisma.paymentAttempt.create).not.toHaveBeenCalled();
    });
  });

  describe('Persistence of Idempotency Records', () => {
    it('persists record with normalized hash and updates to RESOLVED with response body', async () => {
      const payload = {
        orderId: 'ord_idem_123',
        simulatedOutcome: 'SUCCESS',
      };
      const key = 'idem_key_persist_001';
      const expectedHash = computeRequestHash(payload);

      vi.mocked(prisma.idempotencyRecord.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(sampleOrder as any);
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.idempotencyRecord.create).mockResolvedValue({} as any);

      const createdAttempt = {
        id: 'pay_new_001',
        paymentReference: 'pay_ref_new',
        orderId: 'ord_idem_123',
        amountMinor: 99900,
        currency: 'INR',
        status: 'CREATED',
        provider: 'MOCK_SANDBOX',
        simulatedOutcome: 'SUCCESS',
      };
      const processingAttempt = { ...createdAttempt, status: 'PROCESSING' };
      const succeededAttempt = { ...createdAttempt, status: 'SUCCEEDED' };

      vi.mocked(prisma.paymentAttempt.create).mockResolvedValue(createdAttempt as any);
      vi.mocked(prisma.paymentAttempt.update)
        .mockResolvedValueOnce(processingAttempt as any)
        .mockResolvedValueOnce(succeededAttempt as any);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...sampleOrder,
        status: 'COMPLETED',
      } as any);
      vi.mocked(prisma.paymentAttempt.findUnique).mockResolvedValue({
        ...createdAttempt,
        status: 'SUCCEEDED',
        order: { ...sampleOrder, status: 'COMPLETED' },
      } as any);
      vi.mocked(prisma.idempotencyRecord.update).mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Idempotency-Key', key)
        .send(payload);

      expect(res.status).toBe(201);
      expect(prisma.idempotencyRecord.create).toHaveBeenCalledWith({
        data: {
          key,
          orderId: 'ord_idem_123',
          requestHash: expectedHash,
          status: 'PROCESSING',
        },
      });
      expect(prisma.idempotencyRecord.update).toHaveBeenCalledWith({
        where: { key },
        data: expect.objectContaining({
          status: 'RESOLVED',
          statusCode: 201,
        }),
      });
    });
  });

  describe('Recovery from Simulated Provider Timeouts', () => {
    it('sets status to UNCERTAIN and does not mark order as completed or blindly retry', async () => {
      const payload = {
        orderId: 'ord_idem_123',
        simulatedOutcome: 'TIMEOUT',
      };
      const key = 'idem_key_timeout_001';

      vi.mocked(prisma.idempotencyRecord.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(sampleOrder as any);
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.idempotencyRecord.create).mockResolvedValue({} as any);

      const createdAttempt = {
        id: 'pay_timeout_001',
        paymentReference: 'pay_ref_timeout',
        orderId: 'ord_idem_123',
        amountMinor: 99900,
        currency: 'INR',
        status: 'CREATED',
        provider: 'MOCK_SANDBOX',
        simulatedOutcome: 'TIMEOUT',
      };
      const processingAttempt = { ...createdAttempt, status: 'PROCESSING' };
      const uncertainAttempt = {
        ...createdAttempt,
        status: 'UNCERTAIN',
        failureReason: 'GATEWAY_TIMEOUT_UNCERTAIN_STATUS',
      };

      vi.mocked(prisma.paymentAttempt.create).mockResolvedValue(createdAttempt as any);
      vi.mocked(prisma.paymentAttempt.update)
        .mockResolvedValueOnce(processingAttempt as any)
        .mockResolvedValueOnce(uncertainAttempt as any);

      vi.mocked(prisma.paymentAttempt.findUnique).mockResolvedValue({
        ...uncertainAttempt,
        order: { ...sampleOrder, status: 'PROCESSING' },
      } as any);

      const res = await request(app)
        .post('/api/v1/payments')
        .set('Idempotency-Key', key)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('UNCERTAIN');
      expect(res.body.data.failureReason).toBe('GATEWAY_TIMEOUT_UNCERTAIN_STATUS');
      // Order status should NOT have been updated to COMPLETED or FAILED
      expect(prisma.order.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'COMPLETED' } })
      );
    });

    it('safely reconciles UNCERTAIN payment to SUCCEEDED without blind re-charging', async () => {
      const uncertainPayment = {
        id: 'pay_timeout_001',
        paymentReference: 'pay_ref_timeout',
        orderId: 'ord_idem_123',
        amountMinor: 99900,
        currency: 'INR',
        status: 'UNCERTAIN',
        provider: 'MOCK_SANDBOX',
        simulatedOutcome: 'TIMEOUT',
        failureReason: 'GATEWAY_TIMEOUT_UNCERTAIN_STATUS',
        order: { ...sampleOrder, status: 'PROCESSING' },
      };

      vi.mocked(prisma.paymentAttempt.findFirst).mockResolvedValue(uncertainPayment as any);
      vi.mocked(prisma.paymentAttempt.update).mockResolvedValue({
        ...uncertainPayment,
        status: 'SUCCEEDED',
        failureReason: null,
      } as any);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...sampleOrder,
        status: 'COMPLETED',
      } as any);
      vi.mocked(prisma.paymentAttempt.findUnique).mockResolvedValue({
        ...uncertainPayment,
        status: 'SUCCEEDED',
        order: { ...sampleOrder, status: 'COMPLETED' },
      } as any);

      const res = await request(app)
        .post('/api/v1/payments/pay_timeout_001/reconcile')
        .send({ resolution: 'SUCCESS' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUCCEEDED');
      expect(prisma.paymentAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'SUCCEEDED', failureReason: null },
        })
      );
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'COMPLETED' },
        })
      );
    });

    it('blocks reconciliation on already terminal payment (409 TERMINAL_STATE_CONFLICT)', async () => {
      const terminalPayment = {
        id: 'pay_terminal_001',
        paymentReference: 'pay_ref_term',
        orderId: 'ord_idem_123',
        amountMinor: 99900,
        currency: 'INR',
        status: 'SUCCEEDED', // Terminal state
        order: { ...sampleOrder, status: 'COMPLETED' },
      };

      vi.mocked(prisma.paymentAttempt.findFirst).mockResolvedValue(terminalPayment as any);

      const res = await request(app)
        .post('/api/v1/payments/pay_terminal_001/reconcile')
        .send({ resolution: 'SUCCESS' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TERMINAL_STATE_CONFLICT');
    });
  });
});
