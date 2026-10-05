import { Router } from 'express';
import { body } from 'express-validator';
import { cancelBooking, createBooking } from '../controllers/bookings.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/', requireAuth, [
  body('event_id').isInt({ min: 1 }).withMessage('Select a valid event.'),
  body('tickets').isInt({ min: 1, max: 20 }).withMessage('Tickets must be between 1 and 20.')
], createBooking);
router.patch('/:id/cancel', requireAuth, cancelBooking);

export default router;