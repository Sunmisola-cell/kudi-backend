import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:          { type: String, required: true, trim: true },
    targetAmount:  { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, default: 0, min: 0 },
    deadline:      { type: Date, default: null },
    color:         { type: String, default: '#22c55e' },
    icon:          { type: String, default: '🎯' },
  },
  { timestamps: true }
);

export default mongoose.model('SavingsGoal', savingsGoalSchema);
