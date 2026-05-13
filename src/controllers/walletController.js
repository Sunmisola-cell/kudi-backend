import mongoose from 'mongoose';
import bcrypt    from 'bcryptjs';
import Wallet    from '../models/Wallet.js';
import User      from '../models/User.js';
import { fundWallet, transferFunds } from '../services/walletService.js';

export async function getWallet(req, res) {
  const wallet = await Wallet.findOne({ userId: req.user._id });
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
  res.json(wallet);
}

export async function fund(req, res) {
  const { amount } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await fundWallet({ userId: req.user._id, amount, session });
    await session.commitTransaction();
    res.json({ wallet });
  } catch (err) {
    await session.abortTransaction();
    res.status(err.status || 500).json({ error: err.message });
  } finally {
    session.endSession();
  }
}

export async function transfer(req, res) {
  const { receiverId, amount, pin, category, description } = req.body;

  // Load user WITH transactionPinHash
  const sender = await User.findById(req.user._id).select('+transactionPinHash');
  if (!sender.transactionPinHash)
    return res.status(400).json({ error: 'Transaction PIN not set. Please set a PIN first.' });
  if (!(await sender.comparePin(pin)))
    return res.status(401).json({ error: 'Incorrect PIN' });

  if (String(req.user._id) === String(receiverId))
    return res.status(400).json({ error: 'Cannot transfer to yourself' });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await transferFunds({ senderId: req.user._id, receiverId, amount, category, description, session });
    await session.commitTransaction();
    res.json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    res.status(err.status || 500).json({ error: err.message });
  } finally {
    session.endSession();
  }
}

export async function setPin(req, res) {
  const { pin } = req.body;
  const hash = await bcrypt.hash(pin, 12);
  await User.findByIdAndUpdate(req.user._id, { transactionPinHash: hash });
  res.json({ success: true });
}
