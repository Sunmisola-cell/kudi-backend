import express from 'express';
import User            from '../models/User.js';
import Wallet          from '../models/Wallet.js';
import Transaction     from '../models/Transaction.js';
import AirtimePurchase from '../models/AirtimePurchase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/stats
router.get('/stats', asyncHandler(async (_req, res) => {
  const [totalUsers, totalTransactions, txData, airtimeData, walletData] = await Promise.all([
    User.countDocuments(),
    Transaction.countDocuments(),
    Transaction.find({}, 'amount type'),
    AirtimePurchase.find({}, 'amount'),
    Wallet.find({}, 'balance'),
  ]);
  res.json({
    totalUsers,
    totalTransactions,
    totalVolume:        txData.reduce((s, t) => s + t.amount, 0),
    totalAirtime:       airtimeData.length,
    totalAirtimeVolume: airtimeData.reduce((s, a) => s + a.amount, 0),
    totalWalletBalance: walletData.reduce((s, w) => s + w.balance, 0),
  });
}));

// GET /api/admin/users
router.get('/users', asyncHandler(async (_req, res) => {
  const users   = await User.find().sort({ createdAt: -1 });
  const wallets = await Wallet.find();
  const walletMap = Object.fromEntries(wallets.map((w) => [w.userId.toString(), w]));
  const result = users.map((u) => ({
    user_id:        u._id,
    full_name:      u.fullName,
    username:       u.username,
    email:          u.email,
    isVerified:     u.isVerified,
    isFrozen:       u.isFrozen || false,
    created_at:     u.createdAt,
    balance:        walletMap[u._id.toString()]?.balance ?? 0,
    account_number: walletMap[u._id.toString()]?.accountNumber ?? '—',
  }));
  res.json(result);
}));

// GET /api/admin/users/export-csv
router.get('/users/export-csv', asyncHandler(async (_req, res) => {
  const users   = await User.find().sort({ createdAt: -1 });
  const wallets = await Wallet.find();
  const walletMap = Object.fromEntries(wallets.map((w) => [w.userId.toString(), w]));

  const header = 'Full Name,Username,Email,Account Number,Balance,Verified,Frozen,Joined';
  const rows = users.map(u => {
    const w = walletMap[u._id.toString()];
    return [
      `"${u.fullName}"`,
      u.username,
      u.email,
      w?.accountNumber || '—',
      w?.balance || 0,
      u.isVerified ? 'Yes' : 'No',
      u.isFrozen ? 'Yes' : 'No',
      new Date(u.createdAt).toISOString().split('T')[0],
    ].join(',');
  });

  const csv = [header, ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="kuditrack-users-${Date.now()}.csv"`);
  res.send(csv);
}));

// GET /api/admin/users/:id
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -transactionPinHash -otpHash');
  if (!user) return res.status(404).json({ error: 'User not found' });
  const wallet = await Wallet.findOne({ userId: user._id });
  res.json({
    user_id:        user._id,
    full_name:      user.fullName,
    username:       user.username,
    email:          user.email,
    isVerified:     user.isVerified,
    isFrozen:       user.isFrozen || false,
    created_at:     user.createdAt,
    balance:        wallet?.balance ?? 0,
    account_number: wallet?.accountNumber ?? '—',
  });
}));

// GET /api/admin/users/:id/transactions
router.get('/users/:id/transactions', asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const filter = {
    $or: [
      { senderId: userId, type: 'debit' },
      { receiverId: userId, type: 'credit', senderId: { $ne: userId } },
    ],
  };
  const txs = await Transaction.find(filter).sort({ createdAt: -1 }).limit(100);

  const userIds = [...new Set([
    ...txs.map(t => t.senderId?.toString()),
    ...txs.map(t => t.receiverId?.toString()),
  ].filter(Boolean))];
  const users = await User.find({ _id: { $in: userIds } }, 'fullName username');
  const uMap  = Object.fromEntries(users.map(u => [u._id.toString(), u]));

  const enriched = txs.map(tx => {
    const sender   = uMap[tx.senderId?.toString()];
    const receiver = uMap[tx.receiverId?.toString()];
    let counterparty = null;
    if (tx.type === 'debit' && receiver && tx.receiverId?.toString() !== userId) {
      counterparty = { fullName: receiver.fullName, username: receiver.username };
    } else if (tx.type === 'credit' && sender && tx.senderId?.toString() !== userId) {
      counterparty = { fullName: sender.fullName, username: sender.username };
    }
    return { id: tx._id, type: tx.type, amount: tx.amount, category: tx.category, status: tx.status, description: tx.description, created_at: tx.createdAt, counterparty };
  });
  res.json({ transactions: enriched });
}));

// POST /api/admin/users/:id/toggle-freeze
router.post('/users/:id/toggle-freeze', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.isFrozen = !user.isFrozen;
  await user.save();
  res.json({ success: true, isFrozen: user.isFrozen });
}));

// GET /api/admin/transactions
router.get('/transactions', asyncHandler(async (_req, res) => {
  const txs     = await Transaction.find().sort({ createdAt: -1 }).limit(200);
  const userIds = [...new Set([
    ...txs.map((t) => t.senderId?.toString()),
    ...txs.map((t) => t.receiverId?.toString()),
  ].filter(Boolean))];
  const users = await User.find({ _id: { $in: userIds } }, 'fullName username');
  const uMap  = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
  const result = txs.map((t) => ({
    id:                t._id,
    sender_name:       uMap[t.senderId?.toString()]?.fullName   ?? 'Unknown',
    sender_username:   uMap[t.senderId?.toString()]?.username   ?? '—',
    receiver_name:     uMap[t.receiverId?.toString()]?.fullName ?? 'Unknown',
    receiver_username: uMap[t.receiverId?.toString()]?.username ?? '—',
    amount:            t.amount,
    type:              t.type,
    category:          t.category,
    status:            t.status,
    description:       t.description,
    created_at:        t.createdAt,
  }));
  res.json(result);
}));

// GET /api/admin/activity
router.get('/activity', asyncHandler(async (_req, res) => {
  const [txs, airtime, newUsers] = await Promise.all([
    Transaction.find().sort({ createdAt: -1 }).limit(10).populate('senderId', 'fullName username'),
    AirtimePurchase.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'fullName'),
    User.find().sort({ createdAt: -1 }).limit(5),
  ]);
  const events = [
    ...txs.map((t) => ({ id: `tx-${t._id}`, type: 'transaction', icon: t.type === 'credit' ? '💰' : '📤', label: `${t.senderId?.fullName ?? 'Someone'} ${t.type === 'credit' ? 'received' : 'sent'} ₦${t.amount.toLocaleString()}`, sub: t.description || t.category, time: t.createdAt })),
    ...airtime.map((a) => ({ id: `air-${a._id}`, type: 'airtime', icon: '📱', label: `${a.userId?.fullName ?? 'Someone'} bought ₦${a.amount.toLocaleString()} ${a.network} airtime`, sub: a.phoneNumber, time: a.createdAt })),
    ...newUsers.map((u) => ({ id: `user-${u._id}`, type: 'signup', icon: '👤', label: `${u.fullName} joined KudiTrack`, sub: `@${u.username}`, time: u.createdAt })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 20);
  res.json(events);
}));

export default router;
