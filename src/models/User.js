import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName:           { type: String, required: true, trim: true },
  username:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  email:              { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:           { type: String, required: true },
  avatarUrl:          { type: String, default: null },
  qrCode:             { type: String },
  transactionPinHash: { type: String, default: null, select: false },
  isEmailVerified:    { type: Boolean, default: false },
  isFrozen:           { type: Boolean, default: false },
  otpHash:            { type: String, default: null, select: false },
  otpExpiresAt:       { type: Date,   default: null, select: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (pwd) { return bcrypt.compare(pwd, this.password); };
userSchema.methods.comparePin = function (pin) {
  if (!this.transactionPinHash) return Promise.resolve(false);
  return bcrypt.compare(pin, this.transactionPinHash);
};
userSchema.methods.compareOtp = function (otp) {
  if (!this.otpHash) return Promise.resolve(false);
  return bcrypt.compare(String(otp), this.otpHash);
};

export default mongoose.model('User', userSchema);
