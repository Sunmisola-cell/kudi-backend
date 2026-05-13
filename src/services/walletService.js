import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import SavingsGoal from '../models/SavingsGoal.js';

// ─── Fund wallet (credit) ─────────────────────────────────────────────────────
export async function fundWallet({ userId, amount, session }) {
  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount } },
    { new: true, session }
  );

  if (!wallet) {
    throw Object.assign(new Error('Wallet not found'), { status: 404 });
  }

  await Transaction.create(
    [
      {
        senderId: userId,
        receiverId: userId,
        amount,
        type: 'credit',
        category: 'funding',
        status: 'success',
        description: 'Wallet funding',
      },
    ],
    {
      session,
      ordered: true,
    }
  );

  return wallet;
}

// ─── P2P Transfer ─────────────────────────────────────────────────────────────
export async function transferFunds({
  senderId,
  receiverId,
  amount,
  category,
  description,
  session,
}) {
  const senderWallet = await Wallet.findOne({
    userId: senderId,
  }).session(session);

  if (!senderWallet) {
    throw Object.assign(new Error('Sender wallet not found'), {
      status: 404,
    });
  }

  if (senderWallet.balance < amount) {
    throw Object.assign(new Error('Insufficient balance'), {
      status: 400,
    });
  }

  const receiverWallet = await Wallet.findOne({
    userId: receiverId,
  }).session(session);

  if (!receiverWallet) {
    throw Object.assign(new Error('Recipient wallet not found'), {
      status: 404,
    });
  }

  // debit sender
  await Wallet.findOneAndUpdate(
    { userId: senderId },
    { $inc: { balance: -amount } },
    { session }
  );

  // credit receiver
  await Wallet.findOneAndUpdate(
    { userId: receiverId },
    { $inc: { balance: amount } },
    { session }
  );

  // create transaction records
  await Transaction.create(
    [
      {
        senderId,
        receiverId,
        amount,
        type: 'debit',
        category,
        status: 'success',
        description,
      },
      {
        senderId,
        receiverId,
        amount,
        type: 'credit',
        category,
        status: 'success',
        description,
      },
    ],
    {
      session,
      ordered: true,
    }
  );

  return { success: true };
}

// ─── Savings deposit ──────────────────────────────────────────────────────────
export async function depositToSavings({
  userId,
  goalId,
  amount,
  session,
}) {
  const wallet = await Wallet.findOne({ userId }).session(session);

  if (!wallet) {
    throw Object.assign(new Error('Wallet not found'), {
      status: 404,
    });
  }

  if (wallet.balance < amount) {
    throw Object.assign(new Error('Insufficient balance'), {
      status: 400,
    });
  }

  const goal = await SavingsGoal.findOneAndUpdate(
    { _id: goalId, userId },
    { $inc: { currentAmount: amount } },
    { new: true, session }
  );

  if (!goal) {
    throw Object.assign(new Error('Savings goal not found'), {
      status: 404,
    });
  }

  await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: -amount } },
    { session }
  );

  await Transaction.create(
    [
      {
        senderId: userId,
        receiverId: userId,
        amount,
        type: 'debit',
        category: 'savings',
        status: 'success',
        description: `Savings deposit: ${goal.name}`,
      },
    ],
    {
      session,
      ordered: true,
    }
  );

  return goal;
}

// ─── Savings withdrawal ───────────────────────────────────────────────────────
export async function withdrawFromSavings({
  userId,
  goalId,
  amount,
  session,
}) {
  const goal = await SavingsGoal.findOne({
    _id: goalId,
    userId,
  }).session(session);

  if (!goal) {
    throw Object.assign(new Error('Savings goal not found'), {
      status: 404,
    });
  }

  if (goal.currentAmount < amount) {
    throw Object.assign(
      new Error('Insufficient savings balance'),
      { status: 400 }
    );
  }

  await SavingsGoal.findByIdAndUpdate(
    goalId,
    { $inc: { currentAmount: -amount } },
    { session }
  );

  await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount } },
    { session }
  );

  await Transaction.create(
    [
      {
        senderId: userId,
        receiverId: userId,
        amount,
        type: 'credit',
        category: 'savings',
        status: 'success',
        description: `Savings withdrawal: ${goal.name}`,
      },
    ],
    {
      session,
      ordered: true,
    }
  );

  return { success: true };
}