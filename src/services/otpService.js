import crypto from 'crypto';
import bcrypt  from 'bcryptjs';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a cryptographically random 6-digit OTP.
 * Returns both the plain OTP (to email) and a bcrypt hash (to store).
 */
export async function generateOtp() {
  // crypto.randomInt is cryptographically secure (no modulo bias)
  const otp     = String(crypto.randomInt(100_000, 999_999));
  const otpHash = await bcrypt.hash(otp, 10);
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  return { otp, otpHash, otpExpiresAt };
}

/**
 * Verify a plain OTP against the stored hash and check expiry.
 * Returns true/false; throws descriptive errors for bad states.
 */
export async function verifyOtp(plainOtp, storedHash, expiresAt) {
  if (!storedHash || !expiresAt)
    throw Object.assign(new Error('No OTP found. Please request a new one.'), { status: 400 });

  if (new Date() > new Date(expiresAt))
    throw Object.assign(new Error('OTP has expired. Please request a new one.'), { status: 400 });

  const valid = await bcrypt.compare(plainOtp, storedHash);
  return valid;
}
