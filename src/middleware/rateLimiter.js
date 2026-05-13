import rateLimit from 'express-rate-limit';

// ── Global: applied to every request ─────────────────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// ── Auth endpoints: tighter limit to slow brute-force ─────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again in 15 minutes.' },
});

// ── OTP: very tight to prevent OTP guessing ───────────────────────────────────
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,   // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP attempts. Please request a new code.' },
});

// ── Financial operations ──────────────────────────────────────────────────────
export const transactionLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many transaction requests, slow down.' },
});
