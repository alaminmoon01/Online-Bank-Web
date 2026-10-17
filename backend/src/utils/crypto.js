import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
