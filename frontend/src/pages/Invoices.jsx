import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Receipt } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { SkeletonList } from '../components/common/Skeleton.jsx';
import { getInvoice, listInvoices } from '../api/invoices.api.js';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/format.js';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(nextPage = page) {
    setLoading(true);
    setError('');
    try {
      const res = await listInvoices({ page: nextPage, limit: 10, ...(statusFilter ? { paymentStatus: statusFilter } : {}) });
      setInvoices(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load invoices'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); setPage(1); }, [statusFilter]);

  async function openInvoice(id) {
    try {
      const res = await getInvoice(id);
      setSelected(res.data.data.invoice);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load invoice details'));
    }
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Invoices generated automatically when you subscribe. The backend does not generate PDF files, so printing uses the browser's print view."
        action={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm" aria-label="Filter by payment status">
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="failed">Failed</option>
          </select>
        }
      />
      {loading && <SkeletonList />}
      {error && <ErrorState message={error} onRetry={() => load(page)} />}
      {!loading && !error && invoices.length === 0 && (
        <EmptyState icon={Receipt} title="No invoices yet" message="Invoices appear here when you create a subscription." />
      )}
      {!loading && !error && invoices.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Invoice number</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Billing date</th>
                <th className="px-5 py-3 font-medium">Payment status</th>
                <th className="px-5 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td className="px-5 py-3 font-medium text-gray-900">{invoice.invoiceNumber}</td>
                  <td className="px-5 py-3">{invoice.plan?.name || '—'}</td>
                  <td className="px-5 py-3">{formatCurrency(invoice.amount, invoice.currency)}</td>
                  <td className="px-5 py-3">{formatDate(invoice.billingDate)}</td>
                  <td className="px-5 py-3"><StatusBadge status={invoice.paymentStatus} /></td>
                  <td className="px-5 py-3">
                    <button type="button" onClick={() => openInvoice(invoice._id)} className="font-medium text-indigo-600 hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={pagination} onPage={(p) => { setPage(p); load(p); }} />

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="print-area w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">Invoice {selected.invoiceNumber}</h2>
            <p className="mt-1 text-sm text-gray-500">PayFlow · Subscription & Billing</p>
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-400">Plan</dt><dd className="font-medium">{selected.plan?.name || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Amount</dt><dd className="font-medium">{formatCurrency(selected.amount, selected.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Billing date</dt><dd className="font-medium">{formatDate(selected.billingDate)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Payment status</dt><dd><StatusBadge status={selected.paymentStatus} /></dd></div>
              <div className="flex justify-between"><dt className="text-gray-400">Invoice id</dt><dd className="font-mono text-xs">{selected._id}</dd></div>
            </dl>
            <p className="mt-6 text-xs text-gray-400">This is a simulated billing record. No PDF is generated by the backend.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setSelected(null)} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium">Close</button>
              <button type="button" onClick={() => window.print()} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Print invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
