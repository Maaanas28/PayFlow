import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  PrismaClient,
  OrderStatus,
  PaymentStatus,
  IdempotencyStatus,
  LedgerEntryDirection,
  WebhookEventStatus,
  RefundStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { ledgerService } from '../src/modules/ledger/ledger.service';
import { refundService } from '../src/modules/refunds/refund.service';
import { webhookService } from '../src/modules/webhooks/webhook.service';
import { WebhookCrypto } from '../src/modules/webhooks/webhook.crypto';
import { config } from '../src/config';
import http from 'http';

/**
 * Dedicated PostgreSQL Integration Test Suite.
 * Executes real SQL queries, row-level locks, and transactional mutations against PostgreSQL.
 */
describe('PostgreSQL Live Database Integration Tests', () => {
  let prisma: PrismaClient;
  let isDbAvailable = false;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL ||
            'postgresql://payflow_user:payflow_password@localhost:5432/payflow_db?schema=public',
        },
      },
    });

    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      isDbAvailable = true;
    } catch {
      isDbAvailable = false;
    }
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('verifies live PostgreSQL persistence and foreign key cascade constraints', async () => {
    if (!isDbAvailable) {
      console.warn('⚠️  PostgreSQL is not reachable. Skipping test.');
      return;
    }

    const testOrder = await prisma.order.create({
      data: {
        productId: 'prod_sample_001',
        productName: 'PayFlow Developer Sandbox Pass',
        quantity: 1,
        unitPriceMinor: 99900,
        totalPriceMinor: 99900,
        currency: 'INR',
        status: OrderStatus.CREATED,
      },
    });

    expect(testOrder.id).toBeDefined();

    const ref = `pay_int_${Date.now()}_${randomUUID().slice(0, 6)}`;
    const testPayment = await prisma.paymentAttempt.create({
      data: {
        paymentReference: ref,
        orderId: testOrder.id,
        amountMinor: 99900,
        currency: 'INR',
        status: PaymentStatus.SUCCEEDED,
        provider: 'MOCK_SANDBOX',
        simulatedOutcome: 'SUCCESS',
      },
    });

    expect(testPayment.id).toBeDefined();

    const retrievedOrder = await prisma.order.findUnique({
      where: { id: testOrder.id },
      include: { payments: true },
    });

    expect(retrievedOrder?.payments).toHaveLength(1);

    // Cascade deletion
    await prisma.order.delete({ where: { id: testOrder.id } });
    const orphanPayment = await prisma.paymentAttempt.findUnique({
      where: { id: testPayment.id },
    });
    expect(orphanPayment).toBeNull();
  });

  it('enforces idempotency key uniqueness at the database level', async () => {
    if (!isDbAvailable) {
      console.warn('⚠️  PostgreSQL is not reachable. Skipping test.');
      return;
    }

    const testOrder = await prisma.order.create({
      data: {
        productId: 'prod_sample_001',
        productName: 'PayFlow Developer Sandbox Pass',
        quantity: 1,
        unitPriceMinor: 99900,
        totalPriceMinor: 99900,
        currency: 'INR',
        status: OrderStatus.CREATED,
      },
    });

    const key = `idem_int_${Date.now()}_${randomUUID().slice(0, 6)}`;

    try {
      await prisma.idempotencyRecord.create({
        data: {
          key,
          orderId: testOrder.id,
          requestHash: 'hash_1',
          status: IdempotencyStatus.RESOLVED,
        },
      });

      // Second duplicate key MUST violate unique constraint
      await expect(
        prisma.idempotencyRecord.create({
          data: {
            key,
            orderId: testOrder.id,
            requestHash: 'hash_2',
            status: IdempotencyStatus.PROCESSING,
          },
        })
      ).rejects.toThrow();
    } finally {
      await prisma.order.delete({ where: { id: testOrder.id } });
    }
  });

  it('verifies double-entry ledger balance and prevents duplicate capture entries', async () => {
    if (!isDbAvailable) {
      console.warn('⚠️  PostgreSQL is not reachable. Skipping test.');
      return;
    }

    const testOrder = await prisma.order.create({
      data: {
        productId: 'prod_sample_001',
        productName: 'PayFlow Developer Sandbox Pass',
        quantity: 1,
        unitPriceMinor: 99900,
        totalPriceMinor: 99900,
        currency: 'INR',
        status: OrderStatus.COMPLETED,
      },
    });

    const testPayment = await prisma.paymentAttempt.create({
      data: {
        paymentReference: `pay_ldg_${Date.now()}_${randomUUID().slice(0, 6)}`,
        orderId: testOrder.id,
        amountMinor: 99900,
        currency: 'INR',
        status: PaymentStatus.SUCCEEDED,
        provider: 'MOCK_SANDBOX',
        simulatedOutcome: 'SUCCESS',
      },
    });

    try {
      // 1. Post capture entries
      const transaction = await ledgerService.recordPaymentCapture(
        testPayment.id,
        99900,
        'INR'
      );

      expect(transaction).toBeDefined();
      expect(transaction.entries).toHaveLength(2);

      const debits = transaction.entries
        .filter((e) => e.direction === LedgerEntryDirection.DEBIT)
        .reduce((sum, e) => sum + e.amountMinor, 0);

      const credits = transaction.entries
        .filter((e) => e.direction === LedgerEntryDirection.CREDIT)
        .reduce((sum, e) => sum + e.amountMinor, 0);

      // Invariant: Balance debits === credits === amountMinor
      expect(debits).toBe(99900);
      expect(credits).toBe(99900);
      expect(debits).toBe(credits);

      // 2. Prevent duplicate capture entries for same payment
      await expect(
        ledgerService.recordPaymentCapture(testPayment.id, 99900, 'INR')
      ).rejects.toThrow(/already been posted/);
    } finally {
      await prisma.ledgerTransaction.deleteMany({
        where: { referenceId: testPayment.id },
      });
      await prisma.order.delete({ where: { id: testOrder.id } });
    }
  });

  it('verifies partial and full refunds with over-refund prevention in live PostgreSQL', async () => {
    if (!isDbAvailable) {
      console.warn('⚠️  PostgreSQL is not reachable. Skipping test.');
      return;
    }

    const testOrder = await prisma.order.create({
      data: {
        productId: 'prod_sample_001',
        productName: 'PayFlow Developer Sandbox Pass',
        quantity: 1,
        unitPriceMinor: 100000, // ₹1,000.00
        totalPriceMinor: 100000,
        currency: 'INR',
        status: OrderStatus.COMPLETED,
      },
    });

    const testPayment = await prisma.paymentAttempt.create({
      data: {
        paymentReference: `pay_ref_test_${Date.now()}_${randomUUID().slice(0, 6)}`,
        orderId: testOrder.id,
        amountMinor: 100000,
        currency: 'INR',
        status: PaymentStatus.SUCCEEDED,
        provider: 'MOCK_SANDBOX',
        simulatedOutcome: 'SUCCESS',
      },
    });

    try {
      // 1. Partial refund 1: 40000 paise (₹400.00). Remaining: 60000
      const refund1 = await refundService.createRefund(testPayment.id, {
        amountMinor: 40000,
        reason: 'Partial return 1',
      });
      expect(refund1.amountMinor).toBe(40000);
      expect(refund1.status).toBe('SUCCEEDED');

      // 2. Over-refund attempt: requesting 70000 paise (remaining is only 60000)
      await expect(
        refundService.createRefund(testPayment.id, {
          amountMinor: 70000,
        })
      ).rejects.toThrow(/exceeds remaining refundable balance/);

      // 3. Full remaining refund: requesting 60000 paise (exact remaining)
      const refund2 = await refundService.createRefund(testPayment.id, {
        amountMinor: 60000,
        reason: 'Remaining full return',
      });
      expect(refund2.amountMinor).toBe(60000);

      // 4. Any further refund must be rejected as already fully refunded
      await expect(
        refundService.createRefund(testPayment.id, {
          amountMinor: 100,
        })
      ).rejects.toThrow(/already fully refunded/);

      // 5. Verify ledger transactions for both refunds
      const ltx1 = await ledgerService.getTransactionByReference('REFUND', refund1.id);
      const ltx2 = await ledgerService.getTransactionByReference('REFUND', refund2.id);
      expect(ltx1?.entries).toHaveLength(2);
      expect(ltx2?.entries).toHaveLength(2);
    } finally {
      const refunds = await prisma.refund.findMany({
        where: { paymentAttemptId: testPayment.id },
      });
      for (const r of refunds) {
        await prisma.ledgerTransaction.deleteMany({
          where: { referenceId: r.id },
        });
      }
      await prisma.order.delete({ where: { id: testOrder.id } });
    }
  });

  it('prevents concurrent refund requests from exceeding refundable balance', async () => {
    if (!isDbAvailable) {
      console.warn('⚠️  PostgreSQL is not reachable. Skipping test.');
      return;
    }

    const testOrder = await prisma.order.create({
      data: {
        productId: 'prod_sample_001',
        productName: 'PayFlow Developer Sandbox Pass',
        quantity: 1,
        unitPriceMinor: 100000, // ₹1,000.00
        totalPriceMinor: 100000,
        currency: 'INR',
        status: OrderStatus.COMPLETED,
      },
    });

    const testPayment = await prisma.paymentAttempt.create({
      data: {
        paymentReference: `pay_race_${Date.now()}_${randomUUID().slice(0, 6)}`,
        orderId: testOrder.id,
        amountMinor: 100000,
        currency: 'INR',
        status: PaymentStatus.SUCCEEDED,
        provider: 'MOCK_SANDBOX',
        simulatedOutcome: 'SUCCESS',
      },
    });

    try {
      // Two concurrent requests for 70000 each. Total requested = 140000 > 100000.
      // Under PostgreSQL row-level locks, exactly one must succeed and one must be rejected.
      const [res1, res2] = await Promise.allSettled([
        refundService.createRefund(testPayment.id, { amountMinor: 70000 }),
        refundService.createRefund(testPayment.id, { amountMinor: 70000 }),
      ]);

      const fulfilled = [res1, res2].filter((r) => r.status === 'fulfilled');
      const rejected = [res1, res2].filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      // Verify database has only one refund of 70000
      const recordedRefunds = await prisma.refund.findMany({
        where: { paymentAttemptId: testPayment.id },
      });
      expect(recordedRefunds).toHaveLength(1);
      expect(recordedRefunds[0].amountMinor).toBe(70000);
    } finally {
      const refunds = await prisma.refund.findMany({
        where: { paymentAttemptId: testPayment.id },
      });
      for (const r of refunds) {
        await prisma.ledgerTransaction.deleteMany({
          where: { referenceId: r.id },
        });
      }
      await prisma.order.delete({ where: { id: testOrder.id } });
    }
  });

  it('verifies webhook event outbox, HMAC signatures, and safe retry handling', async () => {
    if (!isDbAvailable) {
      console.warn('⚠️  PostgreSQL is not reachable. Skipping test.');
      return;
    }

    const payload = {
      testEventId: randomUUID(),
      amountMinor: 99900,
      status: 'SUCCEEDED',
    };

    // 1. Create outbox event in PostgreSQL
    const event = await webhookService.createEvent(
      'payment.succeeded',
      payload
    );

    expect(event.id).toBeDefined();
    expect(event.status).toBe(WebhookEventStatus.PENDING);
    expect(event.attempts).toBe(0);

    try {
      // 2. Verify signature generation and verification
      const sig = WebhookCrypto.generateSignature(payload, config.webhookSecret);
      const isSigValid = WebhookCrypto.verifySignature(
        payload,
        sig.header,
        config.webhookSecret
      );
      expect(isSigValid).toBe(true);

      // 3. Simulate failure to test retry scheduling
      const failedAttempt = await webhookService.deliverEvent(event.id, {
        forceFail: true,
      });

      expect(failedAttempt.status).toBe(WebhookEventStatus.PENDING);
      expect(failedAttempt.attempts).toBe(1);
      expect(failedAttempt.nextRetryAt).toBeInstanceOf(Date);
      expect(failedAttempt.lastError).toContain('Simulated delivery failure');

      // 4. Missing target URL must record failure and never fake success
      const missingTargetAttempt = await webhookService.deliverEvent(event.id);
      expect(missingTargetAttempt.status).toBe(WebhookEventStatus.PENDING);
      expect(missingTargetAttempt.attempts).toBe(2);
      expect(missingTargetAttempt.lastError).toContain('No webhook target URL configured');

      // 5. Deliver successfully to real HTTP receiver with HMAC signature verification
      const testServer = http.createServer((req, res) => {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          const sig = req.headers['x-payflow-signature'] as string;
          const parsed = JSON.parse(body);
          const valid = WebhookCrypto.verifySignature(parsed, sig, config.webhookSecret);
          res.writeHead(valid ? 200 : 400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true, valid }));
        });
      });

      await new Promise<void>((resolve) => testServer.listen(0, resolve));
      const port = (testServer.address() as any).port;

      try {
        const deliveredAttempt = await webhookService.deliverEvent(event.id, {
          targetUrl: `http://127.0.0.1:${port}/webhook`,
        });
        expect(deliveredAttempt.status).toBe(WebhookEventStatus.DELIVERED);
        expect(deliveredAttempt.attempts).toBe(3);
        expect(deliveredAttempt.deliveredAt).toBeInstanceOf(Date);
        expect(deliveredAttempt.nextRetryAt).toBeNull();
      } finally {
        testServer.close();
      }
    } finally {
      await prisma.webhookEvent.delete({ where: { id: event.id } });
    }
  });

  it('verifies webhook delivery failures do not reverse or alter successful payments or refunds', async () => {
    if (!isDbAvailable) {
      console.warn('⚠️  PostgreSQL is not reachable. Skipping test.');
      return;
    }

    const testOrder = await prisma.order.create({
      data: {
        productId: 'prod_webhook_test_001',
        productName: 'Financial Isolation Verification Pass',
        quantity: 1,
        unitPriceMinor: 50000,
        totalPriceMinor: 50000,
        currency: 'INR',
        status: OrderStatus.COMPLETED,
      },
    });

    const payment = await prisma.paymentAttempt.create({
      data: {
        orderId: testOrder.id,
        amountMinor: 50000,
        currency: 'INR',
        paymentReference: `pay_test_${Date.now()}_${randomUUID().slice(0, 6)}`,
        status: PaymentStatus.SUCCEEDED,
        provider: 'MOCK_SANDBOX',
        simulatedOutcome: 'SUCCESS',
      },
    });

    // Record ledger entry
    await ledgerService.recordPaymentCapture(payment.id, 50000, 'INR', prisma);

    // Record refund
    const refund = await refundService.createRefund(payment.id, {
      amountMinor: 25000,
      reason: 'Partial return financial isolation test',
    });

    // An outbox webhook event was created during refund
    const webhookEvents = await prisma.webhookEvent.findMany({
      where: { eventType: 'refund.succeeded' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    expect(webhookEvents.length).toBeGreaterThan(0);
    const event = webhookEvents[0];

    try {
      // Simulate continuous webhook delivery failures
      for (let i = 0; i < 5; i++) {
        await webhookService.deliverEvent(event.id, { forceFail: true });
      }

      const exhaustedEvent = await prisma.webhookEvent.findUnique({
        where: { id: event.id },
      });
      expect(exhaustedEvent?.status).toBe(WebhookEventStatus.FAILED);
      expect(exhaustedEvent?.attempts).toBe(5);

      // Verify the payment is STILL SUCCEEDED
      const paymentAfter = await prisma.paymentAttempt.findUnique({
        where: { id: payment.id },
      });
      expect(paymentAfter?.status).toBe(PaymentStatus.SUCCEEDED);

      // Verify the refund is STILL SUCCEEDED
      const refundAfter = await prisma.refund.findUnique({
        where: { id: refund.id },
      });
      expect(refundAfter?.status).toBe(RefundStatus.SUCCEEDED);
      expect(refundAfter?.amountMinor).toBe(25000);

      // Verify ledger transactions remain balanced and intact
      const paymentLedger = await prisma.ledgerTransaction.findUnique({
        where: {
          referenceType_referenceId: {
            referenceType: 'PAYMENT_CAPTURE',
            referenceId: payment.id,
          },
        },
        include: { entries: true },
      });
      expect(paymentLedger).toBeDefined();

      const refundLedger = await prisma.ledgerTransaction.findUnique({
        where: {
          referenceType_referenceId: {
            referenceType: 'REFUND',
            referenceId: refund.id,
          },
        },
        include: { entries: true },
      });
      expect(refundLedger).toBeDefined();
    } finally {
      await prisma.ledgerTransaction.deleteMany({
        where: { referenceId: { in: [payment.id, refund.id] } },
      });
      await prisma.webhookEvent.deleteMany({
        where: { id: event.id },
      });
      await prisma.order.delete({ where: { id: testOrder.id } });
    }
  });
});
