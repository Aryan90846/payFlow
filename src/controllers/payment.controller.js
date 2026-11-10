import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from '../utils/ApiError.js';
import { getPagination, paginate } from '../utils/pagination.js';
import { generateTransactionRef } from '../services/billing.service.js';
import {
  sendPaymentEmail,
  sendSubscriptionEmail,
} from '../services/email.service.js';

function assertOwnerOrAdmin(payment, user) {
  if (user.role !== 'admin' && payment.user.toString() !== user._id.toString()) {
    throw forbidden('You can only access your own payments');
  }
}

export async function createPayment(req, res) {
  const { subscriptionId, paymentMethod, simulate, idempotencyKey } = req.body;

  // Replaying an idempotency key returns the original payment, never a second one.
  if (idempotencyKey) {
    const existing = await Payment.findOne({ idempotencyKey });
    if (existing) {
      assertOwnerOrAdmin(existing, req.user);
      return res.json({ success: true, data: { payment: existing, replayed: true } });
    }
  }

  const subscription = await Subscription.findById(subscriptionId).populate('plan');
  if (!subscription) throw notFound('Subscription not found');
  if (req.user.role !== 'admin' && subscription.user.toString() !== req.user._id.toString()) {
    throw forbidden('You can only pay for your own subscriptions');
  }
  if (['cancelled', 'expired'].includes(subscription.status)) {
    throw badRequest(`Cannot pay for a ${subscription.status} subscription`);
  }

  const invoice = await Invoice.findOne({
    subscription: subscription._id,
    paymentStatus: { $in: ['unpaid', 'failed'] },
  }).sort({ createdAt: -1 });
  if (!invoice) {
    throw conflict('This subscription already has a successful payment for its current invoice');
  }

  // ---- Payment simulation (no real gateway, no card details stored) ----
  const succeeded = simulate !== 'failure';
  const payment = await Payment.create({
    user: subscription.user,
    subscription: subscription._id,
    invoice: invoice._id,
    amount: invoice.amount,
    currency: invoice.currency,
    status: succeeded ? 'succeeded' : 'failed',
    paymentMethod: paymentMethod || 'card',
    transactionRef: generateTransactionRef(),
    idempotencyKey: idempotencyKey || undefined,
    simulatedOutcome: simulate || 'success',
    failureReason: succeeded ? null : 'Simulated payment failure',
  });

  if (succeeded) {
    subscription.status = 'active';
    await subscription.save();
    invoice.paymentStatus = 'paid';
    await invoice.save();
    const payer = await User.findById(subscription.user);
    await sendPaymentEmail(payer, payment, true);
    await sendSubscriptionEmail(payer, subscription, subscription.plan);
  } else {
    invoice.paymentStatus = 'failed';
    await invoice.save();
    await sendPaymentEmail(req.user, payment, false);
  }

  res.status(201).json({ success: true, data: { payment } });
}

export async function listPayments(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.user.role !== 'admin') filter.user = req.user._id;
  if (req.query.userId && req.user.role === 'admin') filter.user = req.query.userId;
  if (req.query.subscriptionId) filter.subscription = req.query.subscriptionId;
  if (req.query.status) filter.status = req.query.status;

  const result = await paginate(
    Payment.find(filter).sort({ createdAt: -1 }),
    Payment.countDocuments(filter),
    { page, limit, skip }
  );
  res.json({ success: true, ...result });
}

export async function getPayment(req, res) {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw notFound('Payment not found');
  assertOwnerOrAdmin(payment, req.user);
  res.json({ success: true, data: { payment } });
}
