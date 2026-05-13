import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import { validate }    from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from '../validators/index.js';
import {
  signup,
  login,
  verifyEmailOtp,
  resendOtp,
  getMe,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup',     authLimiter, validate(signupSchema),     asyncHandler(signup));
router.post('/login',      authLimiter, validate(loginSchema),      asyncHandler(login));
router.post('/verify-otp', otpLimiter,  validate(verifyOtpSchema),  asyncHandler(verifyEmailOtp));
router.post('/resend-otp', otpLimiter,  validate(resendOtpSchema),  asyncHandler(resendOtp));
router.get( '/me',         requireAuth,                             asyncHandler(getMe));

export default router;
