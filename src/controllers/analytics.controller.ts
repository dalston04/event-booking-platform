import { Request, Response, NextFunction } from 'express';
import { analyticsService, AnalyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
  constructor(private service: AnalyticsService = analyticsService) {}

  public getDashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getDashboardAnalytics();
      res.status(200).json({
        status: 'success',
        message: 'Analytics dashboard metrics retrieved successfully',
        data,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const analyticsController = new AnalyticsController();
