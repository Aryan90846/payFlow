import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    billingDate: { type: Date, required: true, default: Date.now },
    paymentStatus: { type: String, enum: ['paid', 'unpaid', 'failed'], default: 'unpaid' },
  },
  { timestamps: true }
);

invoiceSchema.index({ user: 1, createdAt: -1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
