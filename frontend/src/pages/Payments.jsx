import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { SkeletonList } from '../components/common/Skeleton.jsx';
import { listPayments } from '../api/payments.api.js';
import { formatCurrency, formatDateTime, getErrorMessage } from '../utils/format.js';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(nextPage = page) {
    setLoading(true);
    setError('');
    try {
      const res = await listPayments({ page: nextPage, limit: 10, ...(statusFilter ? { status: statusFilter } : {}) });
      setPayments(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load payments'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); setPage(1); }, [statusFilter]);

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Simulated payment history. No real money was charged for these records."
        action={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm" aria-label="Filter by payment status">
            <option value="">All statuses</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        }
      />
      {loading && <SkeletonList />}
      {error && <ErrorState message={error} onRetry={() => load(page)} />}
      {!loading && !error && payments.length === 0 && (
        <EmptyState icon={CreditCard} title="No payments yet" message="Payments you make through checkout will appear here." />
      )}
      {!loading && !error && payments.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Transaction reference</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td className="px-5 py-3 font-medium text-gray-900">{payment.transactionRef}</td>
                  <td className="px-5 py-3">{formatCurrency(payment.amount, payment.currency)}</td>
                  <td className="px-5 py-3 capitalize">{payment.paymentMethod}</td>
                  <td className="px-5 py-3"><StatusBadge status={payment.status} /></td>
                  <td className="px-5 py-3 text-gray-500">{formatDateTime(payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={pagination} onPage={(p) => { setPage(p); load(p); }} />
    </div>
  );
}
