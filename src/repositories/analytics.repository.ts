import { prisma } from '../database/prisma.js';

export interface PlatformOverviewMetrics {
  totalUsers: number;
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
}

export interface TopEventMetric {
  eventId: string;
  title: string;
  ticketsSold: number;
  revenue: number;
  rank: number;
}

export interface RecentAuditLogMetric {
  id: string;
  action: string;
  userId: string | null;
  details: unknown;
  createdAt: Date;
}

export class AnalyticsRepository {
  /**
   * Type-Safe Platform Overview Metrics Aggregation
   */
  public async getOverviewMetrics(): Promise<PlatformOverviewMetrics> {
    try {
      const [totalUsers, totalEvents, confirmedBookings] = await Promise.all([
        prisma.user.count(),
        prisma.event.count(),
        prisma.booking.findMany({
          where: { status: 'CONFIRMED' },
          include: {
            event: {
              select: { price: true },
            },
          },
        }),
      ]);

      const totalBookings = confirmedBookings.reduce(
        (sum: number, b: { seatCount: number }) => sum + b.seatCount,
        0,
      );
      const totalRevenue = confirmedBookings.reduce(
        (sum: number, b: { seatCount: number; event: { price: number } }) =>
          sum + b.seatCount * b.event.price,
        0,
      );

      return {
        totalUsers,
        totalEvents,
        totalBookings,
        totalRevenue,
      };
    } catch (err) {
      console.error('[Analytics Overview Error]:', err);
      return { totalUsers: 0, totalEvents: 0, totalBookings: 0, totalRevenue: 0 };
    }
  }

  /**
   * Type-Safe Top Events Ranking & Aggregation
   */
  public async getTopEvents(limit = 5): Promise<TopEventMetric[]> {
    try {
      const confirmedBookings = await prisma.booking.findMany({
        where: { status: 'CONFIRMED' },
        include: {
          event: {
            select: { id: true, title: true, price: true },
          },
        },
      });

      const eventMap = new Map<string, { title: string; ticketsSold: number; revenue: number }>();

      for (const b of confirmedBookings) {
        const existing = eventMap.get(b.eventId) || {
          title: b.event.title,
          ticketsSold: 0,
          revenue: 0,
        };
        existing.ticketsSold += b.seatCount;
        existing.revenue += b.seatCount * b.event.price;
        eventMap.set(b.eventId, existing);
      }

      const sorted = Array.from(eventMap.entries())
        .map(([eventId, data]) => ({
          eventId,
          title: data.title,
          ticketsSold: data.ticketsSold,
          revenue: data.revenue,
          rank: 1,
        }))
        .sort((a, b) => b.ticketsSold - a.ticketsSold)
        .slice(0, limit);

      sorted.forEach((item, index) => {
        item.rank = index + 1;
      });

      return sorted;
    } catch (err) {
      console.error('[Analytics TopEvents Error]:', err);
      return [];
    }
  }

  /**
   * Recent Audit Logs Query
   */
  public async getRecentAuditLogs(limit = 10): Promise<RecentAuditLogMetric[]> {
    try {
      return await prisma.auditLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          userId: true,
          details: true,
          createdAt: true,
        },
      });
    } catch (err) {
      console.error('[Analytics AuditLogs Error]:', err);
      return [];
    }
  }
}

export const analyticsRepository = new AnalyticsRepository();
