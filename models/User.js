const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: '' },
  balance: { type: Number, default: 0 },
  adsCompleted: { type: Number, default: 0 },
  adsToday: { type: Number, default: 0 },
  lastAdDate: { type: Date, default: null },
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  referralCompleted: { type: Boolean, default: false },
  badge: {
    level: { type: String, default: 'None' },
    count: { type: Number, default: 0 }
  },
  withdrawCount: { type: Number, default: 0 },
  lastWithdraw: { type: Date, default: null },
  totalDonated: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate referral code
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = 'NX' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
