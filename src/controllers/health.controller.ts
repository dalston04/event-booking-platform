import { Request, Response } from 'express';

export class HealthController {
  public getHealth = (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'success',
      message: 'Event Booking Platform API is operational',
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
    });
  };
}

export const healthController = new HealthController();
