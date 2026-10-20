import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookCrypto } from '../src/modules/webhooks/webhook.crypto';
import { WebhookService } from '../src/modules/webhooks/webhook.service';
import { prisma } from '../src/db/prisma';

vi.mock('../src/db/prisma', () => ({
  prisma: {
    webhookEvent: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Webhook Crypto & Service Unit Tests', () => {
  const secret = 'whsec_test_secret_key_abcdef';
  const samplePayload = {
    paymentId: 'pay_123',
    amountMinor: 99900,
    status: 'SUCCEEDED',
  };

  describe('HMAC-SHA256 Signatures', () => {
    it('generates a valid signature in t=...,v1=... format', () => {
      const sig = WebhookCrypto.generateSignature(samplePayload, secret, 1729420000);
      expect(sig.header).toMatch(/^t=1729420000,v1=[a-f0-9]{64}$/);
      expect(sig.timestamp).toBe(1729420000);
    });

    it('verifies a valid signature successfully', () => {
      const now = Math.floor(Date.now() / 1000);
      const sig = WebhookCrypto.generateSignature(samplePayload, secret, now);
      const isValid = WebhookCrypto.verifySignature(samplePayload, sig.header, secret);
      expect(isValid).toBe(true);
    });

    it('rejects signature if payload was tampered', () => {
      const now = Math.floor(Date.now() / 1000);
      const sig = WebhookCrypto.generateSignature(samplePayload, secret, now);

      const tamperedPayload = { ...samplePayload, amountMinor: 100 };
      const isValid = WebhookCrypto.verifySignature(tamperedPayload, sig.header, secret);
      expect(isValid).toBe(false);
    });

    it('rejects signature if secret is incorrect', () => {
      const now = Math.floor(Date.now() / 1000);
      const sig = WebhookCrypto.generateSignature(samplePayload, secret, now);

      const isValid = WebhookCrypto.verifySignature(samplePayload, sig.header, 'wrong_secret');
      expect(isValid).toBe(false);
    });

    it('rejects expired timestamp (replay attack prevention)', () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
      const sig = WebhookCrypto.generateSignature(samplePayload, secret, oldTimestamp);

      const isValid = WebhookCrypto.verifySignature(samplePayload, sig.header, secret, 300);
      expect(isValid).toBe(false);
    });
  });

  describe('Webhook Delivery & Retries', () => {
    const webhookService = new WebhookService();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('schedules retry with exponential backoff on simulated failure', async () => {
      const eventRecord = {
        id: 'evt_001',
        eventType: 'payment.succeeded',
        payload: samplePayload,
        targetUrl: 'http://localhost:9999/webhook',
        status: 'PENDING',
        attempts: 1,
        lastError: null,
      };

      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue(eventRecord as any);
      vi.mocked(prisma.webhookEvent.update).mockResolvedValue({} as any);

      await webhookService.deliverEvent('evt_001', { forceFail: true });

      expect(prisma.webhookEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt_001' },
        data: expect.objectContaining({
          status: 'PENDING',
          attempts: 2,
          lastError: expect.stringContaining('Simulated delivery failure'),
          nextRetryAt: expect.any(Date),
        }),
      });
    });

    it('transitions event to FAILED when maximum attempts are exhausted', async () => {
      const eventRecord = {
        id: 'evt_002',
        eventType: 'payment.succeeded',
        payload: samplePayload,
        targetUrl: 'http://localhost:9999/webhook',
        status: 'PENDING',
        attempts: 4, // Next attempt will be 5 (max)
        lastError: null,
      };

      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue(eventRecord as any);
      vi.mocked(prisma.webhookEvent.update).mockResolvedValue({} as any);

      await webhookService.deliverEvent('evt_002', { forceFail: true });

      expect(prisma.webhookEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt_002' },
        data: expect.objectContaining({
          status: 'FAILED',
          attempts: 5,
          nextRetryAt: null,
        }),
      });
    });

    it('does not re-deliver an already DELIVERED event', async () => {
      const deliveredRecord = {
        id: 'evt_003',
        eventType: 'payment.succeeded',
        payload: samplePayload,
        status: 'DELIVERED',
        attempts: 1,
      };

      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue(deliveredRecord as any);

      const result = await webhookService.deliverEvent('evt_003');
      expect(result.status).toBe('DELIVERED');
      expect(prisma.webhookEvent.update).not.toHaveBeenCalled();
    });

    it('records delivery failure when no targetUrl is provided and does not fake success', async () => {
      const eventRecord = {
        id: 'evt_004',
        eventType: 'payment.succeeded',
        payload: samplePayload,
        targetUrl: null,
        status: 'PENDING',
        attempts: 0,
        lastError: null,
      };

      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue(eventRecord as any);
      vi.mocked(prisma.webhookEvent.update).mockResolvedValue({} as any);

      await webhookService.deliverEvent('evt_004');

      expect(prisma.webhookEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt_004' },
        data: expect.objectContaining({
          status: 'PENDING',
          attempts: 1,
          lastError: expect.stringContaining('No webhook target URL configured'),
        }),
      });
    });

    it('records delivery failure when targetUrl has invalid protocol', async () => {
      const eventRecord = {
        id: 'evt_005',
        eventType: 'refund.succeeded',
        payload: samplePayload,
        targetUrl: 'ftp://invalid-url.com',
        status: 'PENDING',
        attempts: 0,
        lastError: null,
      };

      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue(eventRecord as any);
      vi.mocked(prisma.webhookEvent.update).mockResolvedValue({} as any);

      await webhookService.deliverEvent('evt_005');

      expect(prisma.webhookEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt_005' },
        data: expect.objectContaining({
          status: 'PENDING',
          attempts: 1,
          lastError: expect.stringContaining('Invalid webhook target URL'),
        }),
      });
    });

    it('dispatches HTTP POST with HMAC headers and marks DELIVERED on 200 OK', async () => {
      const eventRecord = {
        id: 'evt_006',
        eventType: 'payment.succeeded',
        payload: samplePayload,
        targetUrl: 'http://localhost:4000/api/v1/webhooks/test-target',
        status: 'PENDING',
        attempts: 0,
        lastError: null,
      };

      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue(eventRecord as any);
      vi.mocked(prisma.webhookEvent.update).mockResolvedValue({} as any);

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as any);

      await webhookService.deliverEvent('evt_006');

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:4000/api/v1/webhooks/test-target',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-PayFlow-Event-Id': 'evt_006',
            'X-PayFlow-Event-Type': 'payment.succeeded',
            'X-PayFlow-Signature': expect.stringMatching(/^t=\d+,v1=[a-f0-9]{64}$/),
          }),
        })
      );

      expect(prisma.webhookEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt_006' },
        data: expect.objectContaining({
          status: 'DELIVERED',
          attempts: 1,
          lastError: null,
          deliveredAt: expect.any(Date),
        }),
      });

      fetchSpy.mockRestore();
    });

    it('records failure and schedules retry when HTTP target returns 500 error', async () => {
      const eventRecord = {
        id: 'evt_007',
        eventType: 'refund.succeeded',
        payload: samplePayload,
        targetUrl: 'http://localhost:4000/webhook',
        status: 'PENDING',
        attempts: 0,
        lastError: null,
      };

      vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue(eventRecord as any);
      vi.mocked(prisma.webhookEvent.update).mockResolvedValue({} as any);

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      await webhookService.deliverEvent('evt_007');

      expect(prisma.webhookEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt_007' },
        data: expect.objectContaining({
          status: 'PENDING',
          attempts: 1,
          lastError: expect.stringContaining('HTTP error from webhook target: 500'),
          nextRetryAt: expect.any(Date),
        }),
      });

      fetchSpy.mockRestore();
    });
  });
});
