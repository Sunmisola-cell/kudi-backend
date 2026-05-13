import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    amount:     { type: Number, required: true, min: 0.01 },
    type:       { type: String, enum: ['credit', 'debit'], required: true },
    category:   {
      type: String,
      enum: ['food','transport','shopping','bills','entertainment','transfer','funding','savings','airtime','other'],
      default: 'other',
    },
    status:      { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
