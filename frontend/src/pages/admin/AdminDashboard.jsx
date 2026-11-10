import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CreditCard, Sparkles, Users, Wallet } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { SkeletonList } from '../../components/common/Skeleton.jsx';
import { getDashboard, runExpiryCheck } from '../../api/admin.api.js';
import { listUsers } from '../../api/users.api.js';
import { listPayments } from '../../api/payments.api.js';
import { formatCurrency, formatDateTime, getErrorMessage } from '../../utils/format.js';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [totalUsers, setTotalUsers] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expiryBusy, setExpiryBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [dashRes, usersRes, payRes] = await Promise.all([
        getDashboard(),
        listUsers({ limit: 1 }),
        listPayments({ limit: 10 }),
      ]);
      setData(dashRes.data.data);
      setTotalUsers(usersRes.data.pagination?.total ?? null);
      setRecentPayments(payRes.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load admin dashboard'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleExpiry() {
    setExpiryBusy(true);
    try {
      const res = await runExpiryCheck();
      toast.success(`Expiry check complete: ${res.data.data.expiredCount} subscription(s) expired`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Expiry check failed'));
    } finally {
      setExpiryBusy(false);
    }
  }

  if (loading) return <SkeletonList />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const totalSubscriptions = (data.subscriptionDistribution || []).reduce((sum, row) => sum + row.count, 0);

  return (
    <div>
      <PageHeader
        title="Admin dashboard"
        subtitle="Customers, subscriptions, and revenue from the real backend."
        action={
          <button type="button" onClick={handleExpiry} disabled={expiryBusy} className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
            {expiryBusy ? 'Running…' : 'Run expiry check'}
          </button>
        }
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={totalUsers ?? '—'} hint="All roles, from the users list" />
        <StatCard icon={Users} label="Total customers" value={data.totalCustomers} hint="Users with the customer role" />
        <StatCard icon={Sparkles} label="Active subscriptions" value={data.totalActiveSubscriptions} hint={`of ${totalSubscriptions} subscriptions in total`} />
        <StatCard icon={Wallet} label="Total revenue" value={formatCurrency(data.totalRevenue)} hint="Successful simulated payments only" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-semibold text-gray-900">Subscription distribution</h2>
          <ul className="mt-4 space-y-3">
            {data.subscriptionDistribution.map((row) => (
              <li key={row.status} className="flex items-center justify-between text-sm">
                <StatusBadge status={row.status} />
                <span className="font-semibold">{row.count}</span>
              </li>
            ))}
            {data.subscriptionDistribution.length === 0 && <li className="text-sm text-gray-500">No subscriptions yet.</li>}
          </ul>
          <Link to="/admin/analytics" className="mt-5 inline-block text-sm font-medium text-indigo-600 hover:underline">View analytics charts →</Link>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-semibold text-gray-900">Recent transactions</h2>
          {recentPayments.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No payments yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {recentPayments.map((payment) => (
                <li key={payment._id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{payment.transactionRef}</p>
                    <p className="text-gray-400">{formatDateTime(payment.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(payment.amount, payment.currency)}</span>
                    <StatusBadge status={payment.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/admin/users" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">Manage users</Link>
        <Link to="/admin/plans" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">Manage plans</Link>
        <Link to="/admin/analytics" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">Analytics</Link>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-gray-400"><CreditCard className="h-4 w-4" /> Admin pages are only reachable with an admin role; customers are redirected to their dashboard.</p>
    </div>
  );
}
