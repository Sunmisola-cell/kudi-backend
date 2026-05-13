import Joi from 'joi';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const signupSchema = Joi.object({
  fullName: Joi.string().min(2).max(80).required().messages({
    'string.min': 'Full name must be at least 2 characters',
  }),
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': 'Username can only contain letters and numbers',
  }),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
  }),
});

export const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp:   Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length':  'OTP must be exactly 6 digits',
    'string.pattern.base': 'OTP must contain only digits',
  }),
});

export const resendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
});

// ── Wallet / Transfer ─────────────────────────────────────────────────────────

export const amountSchema = Joi.object({
  amount: Joi.number().positive().min(1).required().messages({
    'number.positive': 'Amount must be positive',
    'number.min':      'Minimum amount is 1',
  }),
});

export const transferSchema = Joi.object({
  receiverId:  Joi.string().length(24).hex().required(),
  amount:      Joi.number().positive().min(1).required(),
  pin:         Joi.string().length(4).pattern(/^\d+$/).required().messages({
    'string.length':         'PIN must be 4 digits',
    'string.pattern.base':   'PIN must contain only digits',
  }),
  category:    Joi.string().valid('food','transport','shopping','bills','entertainment','transfer','funding','savings','airtime','other').default('transfer'),
  description: Joi.string().max(200).allow('').default(''),
});

// ── PIN ───────────────────────────────────────────────────────────────────────

export const pinSchema = Joi.object({
  pin: Joi.string().length(4).pattern(/^\d+$/).required().messages({
    'string.length':       'PIN must be exactly 4 digits',
    'string.pattern.base': 'PIN must contain only digits',
  }),
});

// ── Airtime ───────────────────────────────────────────────────────────────────

export const airtimeSchema = Joi.object({
  network: Joi.string().valid('MTN','Airtel','Glo','9mobile').required(),
  phone:   Joi.string().pattern(/^0\d{10}$/).required().messages({
    'string.pattern.base': 'Phone must be an 11-digit Nigerian number starting with 0',
  }),
  amount:  Joi.number().positive().min(50).max(50000).required(),
  type:    Joi.string().valid('airtime', 'data').default('airtime'),
  pin:     Joi.string().length(4).pattern(/^\d+$/).required(),
});

// ── Savings ───────────────────────────────────────────────────────────────────

export const createSavingsSchema = Joi.object({
  name:         Joi.string().min(1).max(100).required(),
  targetAmount: Joi.number().positive().min(100).required(),
  deadline:     Joi.date().iso().greater('now').allow(null, '').optional(),
  color:        Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#22c55e'),
  icon:         Joi.string().max(10).default('🎯'),
});

export const savingsDepositSchema = Joi.object({
  amount: Joi.number().positive().min(1).required(),
});

export const savingsWithdrawSchema = Joi.object({
  amount: Joi.number().positive().min(1).required(),
});
