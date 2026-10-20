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
      },
      paymentAttempt: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe('Order Creation & Management Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/orders', () => {
    it('creates an order successfully for a valid catalog product', async () => {
      const mockCreatedOrder = {
        id: 'ord_test_123',
        productId: 'prod_sample_001',
        productName: 'PayFlow Developer Sandbox Pass',
        quantity: 2,
        unitPriceMinor: 99900,
        totalPriceMinor: 199800,
        currency: 'INR',
        status: 'CREATED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(prisma.order.create).mockResolvedValue(mockCreatedOrder as any);

      const res = await request(app)
        .post('/api/v1/orders')
        .send({
          productId: 'prod_sample_001',
          quantity: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('ord_test_123');
      expect(res.body.data.totalPriceMinor).toBe(199800);
      expect(res.body.data.currency).toBe('INR');
      expect(res.body.meta.isSimulation).toBe(true);
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: {
          productId: 'prod_sample_001',
          productName: 'PayFlow Developer Sandbox Pass',
          quantity: 2,
          unitPriceMinor: 99900,
          totalPriceMinor: 199800,
          currency: 'INR',
          status: 'CREATED',
        },
      });
    });

    it('rejects order creation with an unknown product identifier (400)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .send({
          productId: 'prod_non_existent',
          quantity: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_PRODUCT');
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('rejects order creation with invalid quantity <= 0 (400)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .send({
          productId: 'prod_sample_001',
          quantity: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects non-integer quantity (400)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .send({
          productId: 'prod_sample_001',
          quantity: 2.5,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects missing productId (400)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .send({
          quantity: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/orders/products', () => {
    it('returns the catalog items', async () => {
      const res = await request(app).get('/api/v1/orders/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].id).toBe('prod_sample_001');
      expect(res.body.data[0].unitPriceMinor).toBe(99900);
    });
  });
});
