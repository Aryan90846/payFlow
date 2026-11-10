import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Receipt, Sparkles, Calendar } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import StatCard from '../components/common/StatCard.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { SkeletonList } from '../components/common/Skeleton.jsx';
import { getCurrentSubscription } from '../api/subscriptions.api.js';
import { listPayments } from '../api/payments.api.js';
import { listInvoices } from '../api/invoices.api.js';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [subRes, payRes, invRes] = await Promise.all([
        getCurrentSubscription().catch((err) => {
          if (err.response?.status === 404) return null;
          throw err;
        }),
        listPayments({ limit: 5 }),
        listInvoices({ limit: 5 }),
      ]);
      setSubscription(subRes?.data.data.subscription || null);
      setPayments(payRes.data.data);
      setPaymentsTotal(payRes.data.pagination?.total ?? payRes.data.data.length);
      setInvoices(invRes.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your dashboard'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <SkeletonList />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name}`}
        subtitle="Your subscription, payments, and invoices at a glance."
        action={
          <Link to="/plans" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Browse plans
          </Link>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Sparkles} label="Current plan" value={subscription?.plan?.name || 'No plan'} hint={subscription ? `Status: ${subscription.status}` : 'Subscribe to get started'} />
        <StatCard icon={Calendar} label="Renews / ends" value={subscription ? formatDate(subscription.endDate) : '—'} hint={subscription ? `Billing: ${subscription.billingInterval}` : undefined} />
        <StatCard icon={CreditCard} label="Payments" value={paymentsTotal} hint="Total payment records" />
        <StatCard icon={Receipt} label="Recent invoices" value={invoices.length} hint="Shown below" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-semibold text-gray-900">Current subscription</h2>
          {!subscription && (
            <div className="mt-4">
              <EmptyState title="No active subscription" message="Pick a plan to start your subscription." action={<Link to="/plans" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Browse plans</Link>} />
            </div>
          )}
          {subscription && (
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p className="flex justify-between"><span>Plan</span><span className="font-semibold text-gray-900">{subscription.plan?.name}</span></p>
              <p className="flex justify-between"><span>Status</span><StatusBadge status={subscription.status} /></p>
              <p className="flex justify-between"><span>Price</span><span>{formatCurrency(subscription.price, subscription.currency)} / {subscription.billingInterval}</span></p>
              <p className="flex justify-between"><span>Started</span><span>{formatDate(subscription.startDate)}</span></p>
              <p className="flex justify-between"><span>Ends</span><span>{formatDate(subscription.endDate)}</span></p>
              <div className="flex gap-2 pt-3">
                <Link to="/subscriptions" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Manage</Link>
                {subscription.status === 'pending' && (
                  <Link to="/checkout" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Complete payment</Link>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent transactions</h2>
            <Link to="/payments" className="text-sm font-medium text-indigo-600 hover:underline">View all</Link>
          </div>
          {payments.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No payments yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {payments.map((payment) => (
                <li key={payment._id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{payment.transactionRef}</p>
                    <p className="text-gray-400">{formatDate(payment.createdAt)} · {payment.paymentMethod}</p>
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

      <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Quick actions</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/plans" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Browse plans</Link>
          <Link to="/subscriptions" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Manage subscription</Link>
          <Link to="/invoices" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">View invoices</Link>
          <Link to="/settings" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Account settings</Link>
        </div>
      </section>
    </div>
  );
}
