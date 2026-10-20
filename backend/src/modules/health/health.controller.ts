import { Request, Response } from 'express';

export class HealthController {
  check(_req: Request, res: Response): void {
    res.status(200).json({
      status: 'ok',
      service: 'payflow-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  }
}

export const healthController = new HealthController();
