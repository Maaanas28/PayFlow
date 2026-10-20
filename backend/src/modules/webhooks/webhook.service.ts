import { randomUUID } from 'crypto';
import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/app-error';
import { WebhookEvent, WebhookEventStatus } from '../../types';
import { WebhookCrypto } from './webhook.crypto';
import { config } from '../../config';

export interface DeliverEventOptions {
  targetUrl?: string;
  forceFail?: boolean;
}

export class WebhookService {
  /**
   * Persists an immutable webhook event to the database using an outbox pattern.
   */
  async createEvent(
    eventType: string,
    payload: Record<string, unknown>,
    targetUrl?: string,
    client: any = prisma
  ): Promise<WebhookEvent> {
    const id = `evt_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 8)}`;

    const event = await client.webhookEvent.create({
      data: {
        id,
        eventType,
        payload: payload as any,
        targetUrl: targetUrl || config.webhookDefaultUrl || null,
        status: WebhookEventStatus.PENDING,
        attempts: 0,
      },
    });

    return event;
  }

  /**
   * Attempts delivery of an event, signs the payload with HMAC-SHA256,
   * updates delivery attempts, and handles safe retries with exponential backoff.
   */
  async deliverEvent(
    eventId: string,
    options?: DeliverEventOptions
  ): Promise<WebhookEvent> {
    const event = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw AppError.notFound(`Webhook event '${eventId}' not found`, 'WEBHOOK_EVENT_NOT_FOUND');
    }

    if (event.status === WebhookEventStatus.DELIVERED) {
      return event; // Already delivered, do not repeat
    }

    let targetUrl = options?.targetUrl || event.targetUrl;

    // Normalize loopback destinations if dispatched to internal test receiver
    if (targetUrl) {
      if (targetUrl.startsWith('/')) {
        targetUrl = `http://127.0.0.1:${config.port}${targetUrl}`;
      } else if (
        /^https?:\/\/(localhost|127\.0\.0\.1):4000\/api\/v1\/webhooks\/test-target/.test(targetUrl) &&
        config.port !== 4000
      ) {
        targetUrl = targetUrl.replace(
          /^https?:\/\/(localhost|127\.0\.0\.1):4000\/api\/v1\/webhooks\/test-target/,
          `http://127.0.0.1:${config.port}/api/v1/webhooks/test-target`
        );
      }
    }
    const attempts = event.attempts + 1;
    const maxAttempts = 5;

    // Generate cryptographic signature
    const signature = WebhookCrypto.generateSignature(
      event.payload as any,
      config.webhookSecret
    );

    let isSuccess = false;
    let errorMessage: string | null = null;

    if (options?.forceFail) {
      isSuccess = false;
      errorMessage = 'Simulated delivery failure for retry verification';
    } else if (targetUrl) {
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        isSuccess = false;
        errorMessage = `Invalid webhook target URL: '${targetUrl}'. URL must start with http:// or https://`;
      } else {
        try {
          const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-PayFlow-Signature': signature.header,
              'X-PayFlow-Event-Id': event.id,
              'X-PayFlow-Event-Type': event.eventType,
            },
            body: JSON.stringify(event.payload),
          });

          if (response.ok) {
            isSuccess = true;
          } else {
            errorMessage = `HTTP error from webhook target: ${response.status} ${response.statusText}`;
          }
        } catch (err: any) {
          errorMessage = `Network failure dispatching webhook: ${err.message}`;
        }
      }
    } else {
      isSuccess = false;
      errorMessage =
        'No webhook target URL configured. Specify targetUrl or configure WEBHOOK_DEFAULT_URL.';
    }

    if (isSuccess) {
      return prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: WebhookEventStatus.DELIVERED,
          attempts,
          targetUrl: targetUrl || event.targetUrl,
          lastError: null,
          nextRetryAt: null,
          deliveredAt: new Date(),
        },
      });
    }

    // Handle retry scheduling with exponential backoff
    const isExhausted = attempts >= maxAttempts;
    const backoffSeconds = Math.min(Math.pow(2, attempts) * 5, 3600); // 10s, 20s, 40s...
    const nextRetryAt = isExhausted ? null : new Date(Date.now() + backoffSeconds * 1000);

    return prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: isExhausted ? WebhookEventStatus.FAILED : WebhookEventStatus.PENDING,
        attempts,
        targetUrl: targetUrl || event.targetUrl,
        lastError: errorMessage,
        nextRetryAt,
      },
    });
  }

  async getEventById(eventId: string): Promise<WebhookEvent> {
    const event = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw AppError.notFound(`Webhook event '${eventId}' not found`, 'WEBHOOK_EVENT_NOT_FOUND');
    }

    return event;
  }

  async listEvents(limit = 50) {
    return prisma.webhookEvent.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const webhookService = new WebhookService();
