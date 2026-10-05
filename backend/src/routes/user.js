import { Router } from 'express';
import { listUserBookings } from '../controllers/bookings.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/bookings', requireAuth, listUserBookings);

export default router;