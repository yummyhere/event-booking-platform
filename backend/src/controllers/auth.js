import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { get, run } from '../config/db.js';
import { config } from '../config/env.js';
import { httpError } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';

function createToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
}

export async function register(request, response, next) {
  try {
    const errors = validationResult(request);
    if (!errors.isEmpty()) throw httpError(400, errors.array()[0].msg);
    const { name, email, password } = request.body;
    const normalizedEmail = email.trim().toLowerCase();
    if (await get('SELECT id FROM users WHERE email = ?', [normalizedEmail])) {
      throw httpError(409, 'An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await run('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
      name.trim(), normalizedEmail, passwordHash, 'user'
    ]);
    const user = { id: result.lastID, name: name.trim(), email: normalizedEmail, role: 'user' };
    response.status(201).json({ success: true, data: { user, token: createToken(user) } });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') return next(httpError(409, 'An account with this email already exists.'));
    next(error);
  }
}

export async function login(request, response, next) {
  try {
    const errors = validationResult(request);
    if (!errors.isEmpty()) throw httpError(400, errors.array()[0].msg);
    const user = await get('SELECT id, name, email, role, password_hash FROM users WHERE email = ?', [
      request.body.email.trim().toLowerCase()
    ]);
    if (!user || !(await bcrypt.compare(request.body.password, user.password_hash))) {
      throw httpError(401, 'Email or password is incorrect.');
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    response.json({ success: true, data: { user: safeUser, token: createToken(safeUser) } });
  } catch (error) {
    next(error);
  }
}

export async function currentUser(request, response, next) {
  try {
    const user = await get('SELECT id, name, email, role FROM users WHERE id = ?', [request.user.id]);
    if (!user) throw httpError(401, 'Account no longer exists.');
    response.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
}