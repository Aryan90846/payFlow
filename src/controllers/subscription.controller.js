import { Plan } from '../models/Plan.js';
import { Subscription } from '../models/Subscription.js';
import { Invoice } from '../models/Invoice.js';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from '../utils/ApiError.js';
import { getPagination, paginate } from '../utils/pagination.js';
import {
  addBillingPeriod,
  generateInvoiceNumber,
} from '../services/billing.service.js';
import { sendCancellationEmail } from '../services/email.service.js';

function assertOwnerOrAdmin(subscription, user) {
  if (user.role !== 'admin' && subscription.user.toString() !== user._id.toString()) {
    throw forbidden('You can only access your own subscriptions');
  }
}

export async function createSubscription(req, res) {
  const plan = await Plan.findById(req.body.planId);
  if (!plan || !plan.isActive) throw notFound('Active plan not found');

  // One live subscription per customer: an active or pending one blocks a new one.
  const existing = await Subscription.findOne({
    user: req.user._id,
    status: { $in: ['active', 'pending'] },
  });
  if (existing) {
    throw conflict('You already have an active or pending subscription');
  }

  const startDate = new Date();
  const endDate = addBillingPeriod(startDate, plan.billingInterval);
  const subscription = await Subscription.create({
    user: req.user._id,
    plan: plan._id,
    status: 'pending',
    price: plan.price,
    currency: plan.currency,
    billingInterval: plan.billingInterval,
    startDate,
    endDate,
    nextBillingDate: endDate,
  });
  await Invoice.create({
    invoiceNumber: generateInvoiceNumber(),
    user: req.user._id,
    subscription: subscription._id,
    plan: plan._id,
    amount: plan.price,
    currency: plan.currency,
    billingDate: startDate,
    paymentStatus: 'unpaid',
  });

  const populated = await subscription.populate('plan');
  res.status(201).json({ success: true, data: { subscription: populated } });
}

export async function listSubscriptions(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.user.role !== 'admin') filter.user = req.user._id;
  if (req.query.userId && req.user.role === 'admin') filter.user = req.query.userId;
  if (req.query.status) filter.status = req.query.status;

  const result = await paginate(
    Subscription.find(filter).sort({ createdAt: -1 }).populate('plan'),
    Subscription.countDocuments(filter),
    { page, limit, skip }
  );
  res.json({ success: true, ...result });
}

export async function getCurrentSubscription(req, res) {
  const subscription = await Subscription.findOne({
    user: req.user._id,
    status: { $in: ['active', 'pending'] },
  })
    .sort({ createdAt: -1 })
    .populate('plan');
  if (!subscription) throw notFound('No current subscription found');
  res.json({ success: true, data: { subscription } });
}

export async function getSubscription(req, res) {
  const subscription = await Subscription.findById(req.params.id).populate('plan');
  if (!subscription) throw notFound('Subscription not found');
  assertOwnerOrAdmin(subscription, req.user);
  res.json({ success: true, data: { subscription } });
}

export async function changePlan(req, res) {
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) throw notFound('Subscription not found');
  assertOwnerOrAdmin(subscription, req.user);
  if (!['active', 'pending'].includes(subscription.status)) {
    throw badRequest('Only an active or pending subscription can change plan');
  }
  const plan = await Plan.findById(req.body.planId);
  if (!plan || !plan.isActive) throw notFound('Active plan not found');
  if (plan._id.toString() === subscription.plan.toString()) {
    throw badRequest('You are already on this plan');
  }

  subscription.plan = plan._id;
  subscription.price = plan.price;
  subscription.currency = plan.currency;
  subscription.billingInterval = plan.billingInterval;
  await subscription.save();
  const populated = await subscription.populate('plan');
  res.json({ success: true, data: { subscription: populated } });
}

export async function cancelSubscription(req, res) {
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) throw notFound('Subscription not found');
  assertOwnerOrAdmin(subscription, req.user);
  if (!['active', 'pending'].includes(subscription.status)) {
    throw badRequest('Only an active or pending subscription can be cancelled');
  }
  subscription.status = 'cancelled';
  subscription.cancelledAt = new Date();
  await subscription.save();
  await sendCancellationEmail(req.user, subscription);
  res.json({ success: true, data: { subscription } });
}
