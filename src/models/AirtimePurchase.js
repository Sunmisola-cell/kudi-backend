import mongoose from 'mongoose';

const airtimePurchaseSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    network:      { type: String, required: true },
    phoneNumber:  { type: String, required: true },
    amount:       { type: Number, required: true, min: 0.01 },
    purchaseType: { type: String, default: 'airtime' },
    status:       { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
  },
  { timestamps: true }
);

export default mongoose.model('AirtimePurchase', airtimePurchaseSchema);
