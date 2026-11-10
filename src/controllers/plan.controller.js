import { Plan } from '../models/Plan.js';
import { notFound } from '../utils/ApiError.js';
import { getPagination, paginate } from '../utils/pagination.js';

export async function createPlan(req, res) {
  const plan = await Plan.create(req.body);
  res.status(201).json({ success: true, data: { plan } });
}

export async function listPlans(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  // Customers only ever see active plans. Admins can pass ?all=true.
  const filter = {};
  const isAdmin = req.user?.role === 'admin';
  if (!(isAdmin && req.query.all === 'true')) filter.isActive = true;
  if (req.query.billingInterval) filter.billingInterval = req.query.billingInterval;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

  const result = await paginate(
    Plan.find(filter).sort({ price: 1 }),
    Plan.countDocuments(filter),
    { page, limit, skip }
  );
  res.json({ success: true, ...result });
}

export async function getPlan(req, res) {
  const plan = await Plan.findById(req.params.id);
  if (!plan) throw notFound('Plan not found');
  if (!plan.isActive && req.user?.role !== 'admin') {
    throw notFound('Plan not found');
  }
  res.json({ success: true, data: { plan } });
}

export async function updatePlan(req, res) {
  const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!plan) throw notFound('Plan not found');
  res.json({ success: true, data: { plan } });
}

export async function deletePlan(req, res) {
  const plan = await Plan.findByIdAndDelete(req.params.id);
  if (!plan) throw notFound('Plan not found');
  res.json({ success: true, message: 'Plan deleted' });
}
