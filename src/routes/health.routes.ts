import { Router, Request, Response } from 'express';
import { healthController } from '../controllers/health.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public Health Check
router.get('/health', healthController.getHealth);

// Protected User Route Test
router.get('/protected/profile', authenticate, (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Access granted to protected profile endpoint',
    user: req.user,
  });
});

// Protected Admin Route Test (RBAC)
router.get('/protected/admin-dashboard', authenticate, authorize('ADMIN'), (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Admin Control Center',
    adminUser: req.user,
  });
});

export default router;
