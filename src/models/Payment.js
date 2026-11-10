import mongoose from 'mongoose';

// Simulation only: no card numbers, CVV, or any real payment credentials
// are ever stored on this model.
const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true,
    },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['succeeded', 'failed', 'pending'], required: true },
    paymentMethod: { type: String, enum: ['card', 'upi', 'netbanking'], default: 'card' },
    transactionRef: { type: String, required: true, unique: true },
    // Optional client-supplied key. Replaying the same key returns the
    // original payment instead of charging twice.
    idempotencyKey: { type: String, unique: true, sparse: true },
    simulatedOutcome: { type: String, enum: ['success', 'failure'] },
    failureReason: { type: String, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
