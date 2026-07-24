import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createBookingSchema } from '../validators/booking.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rate-limiter.middleware.js';

const router = Router();

// Rate limiter on booking reservations (Max 10 bookings per 60 seconds per IP)
const bookingLimiter = rateLimiter({
  windowSeconds: 60,
  maxRequests: 10,
  keyPrefix: 'rate_limit:booking',
});

// All booking endpoints require authentication
router.use(authenticate);

router.post('/', bookingLimiter, validateBody(createBookingSchema), bookingController.create);
router.post('/:id/cancel', bookingController.cancel);
router.get('/history', bookingController.getHistory);

export default router;
