import { User } from '../models/User.js';
import { notFound } from '../utils/ApiError.js';
import { getPagination, paginate } from '../utils/pagination.js';

export async function getProfile(req, res) {
  res.json({ success: true, data: { user: req.user } });
}

export async function updateProfile(req, res) {
  req.user.name = req.body.name ?? req.user.name;
  await req.user.save();
  res.json({ success: true, data: { user: req.user } });
}

export async function listUsers(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  const result = await paginate(
    User.find(filter).sort({ createdAt: -1 }),
    User.countDocuments(filter),
    { page, limit, skip }
  );
  res.json({ success: true, ...result });
}

export async function getUserById(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');
  res.json({ success: true, data: { user } });
}

export async function updateUserRole(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');
  user.role = req.body.role;
  await user.save();
  res.json({ success: true, data: { user } });
}
