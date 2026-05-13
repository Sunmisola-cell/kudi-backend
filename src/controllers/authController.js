import User   from '../models/User.js';
import Wallet from '../models/Wallet.js';
import { generateAccountNumber } from '../lib/accountNumber.js';
import { signToken }             from '../lib/jwt.js';
import { generateOtp, verifyOtp } from '../services/otpService.js';
import { sendOtpEmail }           from '../services/emailService.js';

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
export async function signup(req, res) {
  const { email, password, fullName, username } = req.body;

  // Check duplicates
  const exists = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
  });
  if (exists) {
    const field = exists.email === email.toLowerCase() ? 'Email' : 'Username';
    return res.status(409).json({ error: `${field} is already taken` });
  }

  // Generate OTP before creating user
  const { otp, otpHash, otpExpiresAt } = await generateOtp();

  const user = await User.create({
    email,
    password,
    fullName,
    username:        username.toLowerCase(),
    qrCode:          Date.now().toString(),
    isEmailVerified: false,
    otpHash,
    otpExpiresAt,
  });

  // Create wallet immediately
  const accountNumber = generateAccountNumber();
  await Wallet.create({ userId: user._id, accountNumber, balance: 0 });

  // Send OTP — fire and forget (don't block response)
  sendOtpEmail(email, otp, fullName).catch(err =>
    console.error('[OTP Email Error]', err.message)
  );

  res.status(201).json({
    message:          'Account created! Check your email for a 6-digit verification code.',
    email:            user.email,
    requiresVerification: true,
  });
}

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
export async function verifyEmailOtp(req, res) {
  const { email, otp } = req.body;

  // Select OTP fields (excluded from normal queries via toJSON)
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+otpHash +otpExpiresAt');

  if (!user)
    return res.status(404).json({ error: 'Account not found' });
  if (user.isEmailVerified)
    return res.status(400).json({ error: 'Email is already verified' });

  // verifyOtp throws descriptive errors on expiry / mismatch
  let valid;
  try {
    valid = await verifyOtp(otp, user.otpHash, user.otpExpiresAt);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  if (!valid)
    return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });

  // Activate account and clear OTP fields
  user.isEmailVerified = true;
  user.otpHash         = null;
  user.otpExpiresAt    = null;
  await user.save();

  const token = signToken(user._id);
  res.json({
    message: 'Email verified! Welcome to KudiTrack.',
    token,
    user: { id: user._id, email: user.email, fullName: user.fullName, username: user.username },
  });
}

// ── POST /api/auth/resend-otp ─────────────────────────────────────────────────
export async function resendOtp(req, res) {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user)
    return res.status(404).json({ error: 'Account not found' });
  if (user.isEmailVerified)
    return res.status(400).json({ error: 'Email is already verified' });

  // Generate fresh OTP
  const { otp, otpHash, otpExpiresAt } = await generateOtp();
  user.otpHash      = otpHash;
  user.otpExpiresAt = otpExpiresAt;
  await user.save();

  sendOtpEmail(email, otp, user.fullName).catch(err =>
    console.error('[OTP Resend Error]', err.message)
  );

  res.json({ message: 'A new verification code has been sent to your email.' });
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  // Same error for wrong email or wrong password (security best practice)
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ error: 'Invalid email or password' });

  // Block unverified accounts
  if (user.isFrozen)
    return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });

  if (!user.isEmailVerified)
    return res.status(403).json({
      error:                'Please verify your email before logging in.',
      requiresVerification: true,
      email:                user.email,
    });

  const token = signToken(user._id);
  res.json({
    token,
    user: { id: user._id, email: user.email, fullName: user.fullName, username: user.username },
  });
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
export async function getMe(req, res) {
  res.json({
    user: {
      id:       req.user._id,
      email:    req.user.email,
      fullName: req.user.fullName,
      username: req.user.username,
    },
  });
}
