import { analyticsRepository, AnalyticsRepository, PlatformOverviewMetrics, TopEventMetric, RecentAuditLogMetric } from '../repositories/analytics.repository.js';

export interface DashboardAnalyticsResponse {
  overview: PlatformOverviewMetrics;
  topEvents: TopEventMetric[];
  recentAuditLogs: RecentAuditLogMetric[];
}

export class AnalyticsService {
  constructor(private analyticsRepo: AnalyticsRepository = analyticsRepository) {}

  /**
   * Aggregates platform overview metrics, top performing events, and audit logs
   */
  public async getDashboardAnalytics(): Promise<DashboardAnalyticsResponse> {
    const [overview, topEvents, recentAuditLogs] = await Promise.all([
      this.analyticsRepo.getOverviewMetrics(),
      this.analyticsRepo.getTopEvents(5),
      this.analyticsRepo.getRecentAuditLogs(10),
    ]);

    return {
      overview,
      topEvents,
      recentAuditLogs,
    };
  }
}

export const analyticsService = new AnalyticsService();
