import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rate-limiter.middleware.js';

const router = Router();

// Strict Rate Limiting on Login (Max 5 login attempts per 60 seconds per IP)
const loginLimiter = rateLimiter({
  windowSeconds: 60,
  maxRequests: 5,
  keyPrefix: 'rate_limit:login',
});

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);

export default router;
