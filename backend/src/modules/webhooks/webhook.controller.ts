import { Request, Response, NextFunction } from 'express';
import { webhookService } from './webhook.service';
import { WebhookCrypto } from './webhook.crypto';
import { config } from '../../config';

export class WebhookController {
  async listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const events = await webhookService.listEvents(limit);
      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const event = await webhookService.getEventById(id);
      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async deliverEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { targetUrl, forceFail } = req.body || {};
      const event = await webhookService.deliverEvent(id, { targetUrl, forceFail });
      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Built-in test target for validating webhook delivery and signature verification
   */
  testReceiver(req: Request, res: Response): void {
    const signatureHeader = req.header('X-PayFlow-Signature') || '';
    const eventId = req.header('X-PayFlow-Event-Id');
    const eventType = req.header('X-PayFlow-Event-Type');

    const isValid = WebhookCrypto.verifySignature(
      req.body,
      signatureHeader,
      config.webhookSecret
    );

    res.status(200).json({
      received: true,
      signatureValid: isValid,
      eventId,
      eventType,
      timestamp: new Date().toISOString(),
    });
  }
}

export const webhookController = new WebhookController();
