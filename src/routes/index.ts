import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import eventRoutes from './event.routes.js';
import bookingRoutes from './booking.routes.js';
import analyticsRoutes from './analytics.routes.js';

const apiRouter = Router();

// Mount system routes
apiRouter.use(healthRoutes);

// Mount authentication routes (/api/v1/auth)
apiRouter.use('/auth', authRoutes);

// Mount event routes (/api/v1/events)
apiRouter.use('/events', eventRoutes);

// Mount booking routes (/api/v1/bookings)
apiRouter.use('/bookings', bookingRoutes);

// Mount analytics routes (/api/v1/analytics)
apiRouter.use('/analytics', analyticsRoutes);

export default apiRouter;
