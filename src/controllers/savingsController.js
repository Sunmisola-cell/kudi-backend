import mongoose    from 'mongoose';
import SavingsGoal from '../models/SavingsGoal.js';
import {
  depositToSavings,
  withdrawFromSavings,
} from '../services/walletService.js';

// ── GET /api/savings ──────────────────────────────────────────────────────────
export async function listGoals(req, res) {
  const goals = await SavingsGoal.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(goals);
}

// ── POST /api/savings ─────────────────────────────────────────────────────────
export async function createGoal(req, res) {
  const { name, targetAmount, deadline, color, icon } = req.body;
  const goal = await SavingsGoal.create({
    userId: req.user._id,
    name,
    targetAmount,
    deadline: deadline || null,
    color,
    icon,
  });
  res.status(201).json(goal);
}

// ── POST /api/savings/:id/deposit ─────────────────────────────────────────────
export async function deposit(req, res) {
  const { amount } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const goal = await depositToSavings({
      userId: req.user._id,
      goalId: req.params.id,
      amount,
      session,
    });
    await session.commitTransaction();
    res.json(goal);
  } catch (err) {
    await session.abortTransaction();
    res.status(err.status || 500).json({ error: err.message });
  } finally {
    session.endSession();
  }
}

// ── POST /api/savings/:id/withdraw ────────────────────────────────────────────
export async function withdraw(req, res) {
  const { amount } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await withdrawFromSavings({
      userId: req.user._id,
      goalId: req.params.id,
      amount,
      session,
    });
    await session.commitTransaction();
    res.json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    res.status(err.status || 500).json({ error: err.message });
  } finally {
    session.endSession();
  }
}

// ── DELETE /api/savings/:id ───────────────────────────────────────────────────
export async function deleteGoal(req, res) {
  await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true });
}
