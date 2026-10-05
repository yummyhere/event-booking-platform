import { Router } from 'express';
import { body } from 'express-validator';
import { currentUser, login, register } from '../controllers/auth.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  body('email').isEmail().withMessage('Enter a valid email address.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
], register);
router.post('/login', [
  body('email').isEmail().withMessage('Enter a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.')
], login);
router.get('/me', requireAuth, currentUser);

export default router;