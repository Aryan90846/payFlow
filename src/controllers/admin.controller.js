import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { Payment } from '../models/Payment.js';
import { expireSubscriptions } from '../services/expiry.service.js';

export async function getDashboard(req, res) {
  const [totalCustomers, totalActiveSubscriptions, revenueResult, monthlyRevenue, distribution] =
    await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Subscription.countDocuments({ status: 'active' }),
      Payment.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'succeeded' } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$amount' },
            payments: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Subscription.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

  res.json({
    success: true,
    data: {
      totalCustomers,
      totalActiveSubscriptions,
      totalRevenue: revenueResult[0]?.total || 0,
      monthlyRevenue: monthlyRevenue.map((row) => ({
        year: row._id.year,
        month: row._id.month,
        revenue: row.revenue,
        payments: row.payments,
      })),
      subscriptionDistribution: distribution.map((row) => ({
        status: row._id,
        count: row.count,
      })),
    },
  });
}

export async function runExpiryCheck(req, res) {
  const result = await expireSubscriptions();
  res.json({ success: true, data: result });
}
