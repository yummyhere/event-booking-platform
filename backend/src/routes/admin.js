import { Router } from 'express';
import { adminStats, listAllBookings } from '../controllers/admin.js';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';

const router = Router();
router.use(requireAuth, adminOnly);
router.get('/bookings', listAllBookings);
router.get('/stats', adminStats);

export default router;