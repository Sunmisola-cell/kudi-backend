import Wallet          from '../models/Wallet.js';
import AirtimePurchase from '../models/AirtimePurchase.js';
import Transaction     from '../models/Transaction.js';

/**
 * Deducts wallet balance and records an airtime purchase — all atomically.
 * Session is started in the controller and passed in.
 */
export async function purchaseAirtime({ userId, network, phone, amount, type, session }) {
  const wallet = await Wallet.findOne({ userId }).session(session);
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { status: 404 });
  if (wallet.balance < amount) throw Object.assign(new Error('Insufficient balance'), { status: 400 });

  await Wallet.findOneAndUpdate({ userId }, { $inc: { balance: -amount } }, { session });

  await AirtimePurchase.create(
    [{ userId, network, phoneNumber: phone, amount, purchaseType: type, status: 'success' }],
    { session }
  );

  await Transaction.create(
    [{ senderId: userId, amount, type: 'debit', category: 'airtime', status: 'success', description: `${network} ${type} — ${phone}` }],
    { session }
  );

  return { success: true };
}
