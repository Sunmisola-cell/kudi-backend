import mongoose from 'mongoose';
import User      from '../models/User.js';
import { purchaseAirtime } from '../services/airtimeService.js';

export async function buyAirtime(req, res) {
  const { network, phone, amount, type, pin } = req.body;

  // Load user WITH transactionPinHash to verify PIN
  const user = await User.findById(req.user._id).select('+transactionPinHash');
  if (!user.transactionPinHash)
    return res.status(400).json({ error: 'Transaction PIN not set. Please set a PIN first.' });
  if (!(await user.comparePin(pin)))
    return res.status(401).json({ error: 'Incorrect PIN' });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await purchaseAirtime({ userId: req.user._id, network, phone, amount, type, session });
    await session.commitTransaction();
    res.json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    res.status(err.status || 500).json({ error: err.message });
  } finally {
    session.endSession();
  }
}
