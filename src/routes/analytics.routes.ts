import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Admin-Only Analytics Route
router.get('/dashboard', authenticate, authorize('ADMIN'), analyticsController.getDashboard);

export default router;
