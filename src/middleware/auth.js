import jwt  from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Unauthorized: missing token' });

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select('-password -transactionPinHash -otpHash -otpExpiresAt');
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Block unverified accounts from accessing protected routes
    if (!user.isEmailVerified)
      return res.status(403).json({ error: 'Please verify your email before continuing' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase());

  if (!adminEmails.includes(req.user.email.toLowerCase()))
    return res.status(403).json({ error: 'Admin access only' });

  next();
}
