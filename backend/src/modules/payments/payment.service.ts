import { randomUUID } from 'crypto';
import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/app-error';
import { CreatePaymentInput, ReconcilePaymentInput } from './payment.schema';
import { OrderStatus, PaymentStatus, IdempotencyStatus } from '../../types';
import { assertValidTransition } from './payment.state-machine';
import { mockPaymentProvider } from '../../providers/mock-payment.provider';
import { computeRequestHash } from '../../utils/idempotency';
import { ledgerService } from '../ledger/ledger.service';
import { webhookService } from '../webhooks/webhook.service';

export interface PaymentExecutionResult {
  isReplay: boolean;
  payment: any;
}

export class PaymentService {
  async createPayment(
    input: CreatePaymentInput,
    idempotencyKey?: string
  ): Promise<PaymentExecutionResult> {
    // 1. Enforce Idempotency-Key presence
    if (!idempotencyKey || !idempotencyKey.trim()) {
      throw AppError.badRequest(
        "Missing required 'Idempotency-Key' header for payment creation",
        'IDEMPOTENCY_KEY_REQUIRED'
      );
    }

    const trimmedKey = idempotencyKey.trim();
    const requestHash = computeRequestHash(input);

    // 2. Check for existing idempotency record
    const existingRecord = await prisma.idempotencyRecord.findUnique({
      where: { key: trimmedKey },
    });

    if (existingRecord) {
      // Reusing the key with a different payload MUST return HTTP 409
      if (existingRecord.requestHash !== requestHash) {
        throw AppError.conflict(
          "Idempotency key reused with different request payload",
          'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
          {
            key: trimmedKey,
            storedOrderId: existingRecord.orderId,
            requestedOrderId: input.orderId,
          }
        );
      }

      // If a concurrent request is currently in flight
      if (existingRecord.status === IdempotencyStatus.PROCESSING) {
        throw AppError.conflict(
          "A concurrent payment request with this idempotency key is currently being processed",
          'CONCURRENT_IDEMPOTENCY_REQUEST'
        );
      }

      // If already resolved, return the original cached result without recreating payment
      if (existingRecord.status === IdempotencyStatus.RESOLVED && existingRecord.responseBody) {
        return {
          isReplay: true,
          payment: existingRecord.responseBody,
        };
      }
    }

    // 3. Verify that the order exists
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      throw AppError.notFound(`Order with ID '${input.orderId}' not found`, 'ORDER_NOT_FOUND');
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw AppError.conflict(
        `Order '${input.orderId}' has already been paid and completed`,
        'ORDER_ALREADY_PAID'
      );
    }

    // 4. Atomically prevent concurrent payments from charging the same order more than once
    const orderUpdate = await prisma.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.CREATED,
      },
      data: {
        status: OrderStatus.PROCESSING,
      },
    });

    if (orderUpdate.count === 0) {
      const currentOrder = await prisma.order.findUnique({ where: { id: order.id } });
      if (currentOrder?.status === OrderStatus.COMPLETED) {
        throw AppError.conflict(
          `Order '${input.orderId}' has already been paid and completed`,
          'ORDER_ALREADY_PAID'
        );
      }
      throw AppError.conflict(
        `A payment attempt is already in progress for order '${input.orderId}'`,
        'CONCURRENT_PAYMENT_CONFLICT'
      );
    }

    // 5. Create the Idempotency Record in PROCESSING state
    try {
      await prisma.idempotencyRecord.create({
        data: {
          key: trimmedKey,
          orderId: order.id,
          requestHash,
          status: IdempotencyStatus.PROCESSING,
        },
      });
    } catch (err: any) {
      // Revert order back to CREATED if concurrent key collided
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CREATED },
      });

      if (err.code === 'P2002') {
        throw AppError.conflict(
          "A concurrent payment request with this idempotency key is currently being processed",
          'CONCURRENT_IDEMPOTENCY_REQUEST'
        );
      }
      throw err;
    }

    // 6. Generate unique payment reference
    const paymentReference = `pay_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 8)}`;

    // 7. Create initial payment attempt in CREATED state
    let payment = await prisma.paymentAttempt.create({
      data: {
        paymentReference,
        orderId: order.id,
        amountMinor: order.totalPriceMinor,
        currency: order.currency,
        status: PaymentStatus.CREATED,
        provider: 'MOCK_SANDBOX',
        simulatedOutcome: input.simulatedOutcome,
      },
    });

    // 8. Validate and transition to PROCESSING
    assertValidTransition(payment.status, PaymentStatus.PROCESSING);
    payment = await prisma.paymentAttempt.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.PROCESSING },
    });

    // 9. Execute payment via mock payment provider
    const providerResult = await mockPaymentProvider.processPayment({
      amountMinor: order.totalPriceMinor,
      currency: order.currency,
      orderId: order.id,
      outcome: input.simulatedOutcome,
    });

    // 10. Handle outcome with state transition guards
    if (providerResult.status === 'SUCCEEDED') {
      assertValidTransition(payment.status, PaymentStatus.SUCCEEDED);
      payment = await prisma.paymentAttempt.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.COMPLETED },
      });

      // Post double-entry balanced ledger entries for successful payment capture
      try {
        await ledgerService.recordPaymentCapture(
          payment.id,
          payment.amountMinor,
          payment.currency
        );
      } catch (err: any) {
        // Log if duplicate or handle accordingly
      }

      // Record outbox webhook event for successful payment
      await webhookService.createEvent('payment.succeeded', {
        paymentId: payment.id,
        paymentReference: payment.paymentReference,
        orderId: order.id,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        status: PaymentStatus.SUCCEEDED,
      });
    } else if (providerResult.status === 'UNCERTAIN') {
      // Represent uncertainty explicitly — never blindly retry
      assertValidTransition(payment.status, PaymentStatus.UNCERTAIN);
      payment = await prisma.paymentAttempt.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.UNCERTAIN,
          failureReason: providerResult.failureReason || 'GATEWAY_TIMEOUT_UNCERTAIN_STATUS',
        },
      });

      // Order remains in PROCESSING state awaiting reconciliation
    } else {
      assertValidTransition(payment.status, PaymentStatus.FAILED);
      payment = await prisma.paymentAttempt.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: providerResult.failureReason || 'PAYMENT_DECLINED',
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.FAILED },
      });

      // Record outbox webhook event for failed payment
      await webhookService.createEvent('payment.failed', {
        paymentId: payment.id,
        paymentReference: payment.paymentReference,
        orderId: order.id,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        status: PaymentStatus.FAILED,
        failureReason: payment.failureReason,
      });
    }

    // 11. Retrieve final payment representation with order details
    const finalPayment = await prisma.paymentAttempt.findUnique({
      where: { id: payment.id },
      include: { order: true },
    });

    // 12. Mark Idempotency Record as RESOLVED and cache result
    await prisma.idempotencyRecord.update({
      where: { key: trimmedKey },
      data: {
        status: IdempotencyStatus.RESOLVED,
        statusCode: 201,
        responseBody: finalPayment as any,
      },
    });

    return {
      isReplay: false,
      payment: finalPayment,
    };
  }

  async reconcilePayment(idOrReference: string, input: ReconcilePaymentInput) {
    const payment = await prisma.paymentAttempt.findFirst({
      where: {
        OR: [
          { id: idOrReference },
          { paymentReference: idOrReference },
        ],
      },
      include: { order: true },
    });

    if (!payment) {
      throw AppError.notFound(
        `Payment attempt '${idOrReference}' not found`,
        'PAYMENT_NOT_FOUND'
      );
    }

    // Terminal state protection
    if (payment.status === PaymentStatus.SUCCEEDED || payment.status === PaymentStatus.FAILED) {
      assertValidTransition(payment.status, PaymentStatus.SUCCEEDED); // will throw TERMINAL_STATE_CONFLICT
    }

    if (payment.status !== PaymentStatus.UNCERTAIN) {
      throw AppError.badRequest(
        `Only payments in UNCERTAIN status can be reconciled. Current status: '${payment.status}'`,
        'INVALID_RECONCILIATION_STATE'
      );
    }

    // Safe inquiry without blind re-charging
    const inquiryResult = await mockPaymentProvider.inquirePayment(
      payment.paymentReference,
      input.resolution
    );

    if (inquiryResult.success) {
      assertValidTransition(payment.status, PaymentStatus.SUCCEEDED);
      await prisma.paymentAttempt.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          failureReason: null,
        },
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.COMPLETED },
      });

      try {
        await ledgerService.recordPaymentCapture(
          payment.id,
          payment.amountMinor,
          payment.currency
        );
      } catch (err: any) {
        // Ignore if already posted
      }

      await webhookService.createEvent('payment.succeeded', {
        paymentId: payment.id,
        paymentReference: payment.paymentReference,
        orderId: payment.orderId,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        status: PaymentStatus.SUCCEEDED,
      });
    } else {
      assertValidTransition(payment.status, PaymentStatus.FAILED);
      await prisma.paymentAttempt.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: inquiryResult.failureReason || 'DECLINED_DURING_RECONCILIATION',
        },
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.FAILED },
      });

      await webhookService.createEvent('payment.failed', {
        paymentId: payment.id,
        paymentReference: payment.paymentReference,
        orderId: payment.orderId,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        status: PaymentStatus.FAILED,
        failureReason: inquiryResult.failureReason,
      });
    }

    return prisma.paymentAttempt.findUnique({
      where: { id: payment.id },
      include: { order: true },
    });
  }

  async listPayments(limit = 50) {
    return prisma.paymentAttempt.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: { order: true, refunds: true },
    });
  }

  async getPaymentById(idOrReference: string) {
    const payment = await prisma.paymentAttempt.findFirst({
      where: {
        OR: [
          { id: idOrReference },
          { paymentReference: idOrReference },
        ],
      },
      include: { order: true },
    });

    if (!payment) {
      throw AppError.notFound(
        `Payment attempt '${idOrReference}' not found`,
        'PAYMENT_NOT_FOUND'
      );
    }

    return payment;
  }
}

export const paymentService = new PaymentService();
