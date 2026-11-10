import { Invoice } from '../models/Invoice.js';
import { forbidden, notFound } from '../utils/ApiError.js';
import { getPagination, paginate } from '../utils/pagination.js';

export async function listInvoices(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.user.role !== 'admin') filter.user = req.user._id;
  if (req.query.userId && req.user.role === 'admin') filter.user = req.query.userId;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  const result = await paginate(
    Invoice.find(filter).sort({ createdAt: -1 }).populate('plan'),
    Invoice.countDocuments(filter),
    { page, limit, skip }
  );
  res.json({ success: true, ...result });
}

export async function getInvoice(req, res) {
  const invoice = await Invoice.findById(req.params.id).populate('plan');
  if (!invoice) throw notFound('Invoice not found');
  if (req.user.role !== 'admin' && invoice.user.toString() !== req.user._id.toString()) {
    throw forbidden('You can only access your own invoices');
  }
  res.json({ success: true, data: { invoice } });
}
