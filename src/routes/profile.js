import express from 'express';
import User    from '../models/User.js';
import Wallet  from '../models/Wallet.js';
import { requireAuth }  from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// GET /api/profile
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  // Re-fetch user with transactionPinHash to check if PIN is set
  const user   = await User.findById(req.user._id).select('+transactionPinHash');
  const wallet = await Wallet.findOne({ userId: req.user._id });
  res.json({
    userId:        user._id,
    fullName:      user.fullName,
    username:      user.username,
    email:         user.email,
    avatarUrl:     user.avatarUrl,
    qrCode:        user.qrCode,
    hasPin:        !!user.transactionPinHash,
    walletId:      wallet?._id,
    accountNumber: wallet?.accountNumber,
    createdAt:     user.createdAt,
    updatedAt:     user.updatedAt,
  });
}));

// PATCH /api/profile
router.patch('/', requireAuth, asyncHandler(async (req, res) => {
  const { fullName, username, avatarUrl } = req.body;
  const updates = {};
  if (fullName)  updates.fullName  = fullName;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  if (username) {
    const taken = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.user._id } });
    if (taken) return res.status(409).json({ error: 'Username already taken' });
    updates.username = username.toLowerCase();
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json({ userId: user._id, fullName: user.fullName, username: user.username, email: user.email, avatarUrl: user.avatarUrl });
}));

// GET /api/profile/by-username/:username
router.get('/by-username/:username', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const wallet = await Wallet.findOne({ userId: user._id });
  res.json({ userId: user._id, fullName: user.fullName, username: user.username, accountNumber: wallet?.accountNumber });
}));

// GET /api/profile/by-account/:accountNumber
router.get('/by-account/:accountNumber', requireAuth, asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({ accountNumber: req.params.accountNumber });
  if (!wallet) return res.status(404).json({ error: 'Account not found' });
  const user = await User.findById(wallet.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ userId: user._id, fullName: user.fullName, username: user.username, accountNumber: wallet.accountNumber });
}));

export default router;
