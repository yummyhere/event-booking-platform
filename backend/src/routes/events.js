import { Router } from 'express';
import { body, param } from 'express-validator';
import { createEvent, deleteEvent, updateEvent } from '../controllers/admin.js';
import { getEvent, listEvents } from '../controllers/events.js';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';

const router = Router();
const validateEvent = [
  body('title').isString().trim().isLength({ min: 2, max: 160 }).withMessage('Title must be between 2 and 160 characters.'),
  body('description').optional().isString().isLength({ max: 5000 }).withMessage('Description is too long.'),
  body('category').isString().trim().notEmpty().withMessage('Category is required.'),
  body('location').isString().trim().notEmpty().withMessage('Location is required.'),
  body('event_date').isISO8601().withMessage('Enter a valid event date.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be zero or greater.'),
  body('total_seats').isInt({ min: 1 }).withMessage('Total seats must be at least 1.'),
  body('image_url').optional({ values: 'falsy' }).isString().isLength({ max: 2000 }).withMessage('Image URL is too long.')
];

router.get('/', listEvents);
router.get('/:id', getEvent);
router.post('/', requireAuth, adminOnly, validateEvent, createEvent);
router.put('/:id', requireAuth, adminOnly, [param('id').isInt({ min: 1 }).withMessage('Invalid event id.'), ...validateEvent], updateEvent);
router.delete('/:id', requireAuth, adminOnly, [param('id').isInt({ min: 1 }).withMessage('Invalid event id.')], deleteEvent);

export default router;