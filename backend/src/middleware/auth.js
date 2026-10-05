import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function requireAuth(request, response, next) {
  const [scheme, token] = (request.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    request.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch {
    return response.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}