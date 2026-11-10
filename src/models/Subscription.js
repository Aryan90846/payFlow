import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'pending'],
      default: 'pending',
    },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    billingInterval: { type: String, enum: ['monthly', 'yearly'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    nextBillingDate: { type: Date, required: true },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

subscriptionSchema.index({ user: 1, status: 1, createdAt: -1 });
subscriptionSchema.index({ status: 1, endDate: 1 });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
