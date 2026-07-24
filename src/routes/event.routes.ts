import { Router } from 'express';
import { eventController } from '../controllers/event.controller.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import { createEventSchema, updateEventSchema, eventQuerySchema } from '../validators/event.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public Routes
router.get('/', validateQuery(eventQuerySchema), eventController.getAll);
router.get('/:id', eventController.getById);

// Protected Routes (Require Authentication)
router.post('/', authenticate, validateBody(createEventSchema), eventController.create);
router.put('/:id', authenticate, validateBody(updateEventSchema), eventController.update);
router.delete('/:id', authenticate, eventController.delete);

export default router;
