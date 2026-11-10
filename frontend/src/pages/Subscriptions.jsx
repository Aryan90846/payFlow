import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CreditCard } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { SkeletonList } from '../components/common/Skeleton.jsx';
import { inputClass } from '../components/forms/AuthCard.jsx';
import {
  cancelSubscription,
  changePlan,
  listSubscriptions,
} from '../api/subscriptions.api.js';
import { listPlans } from '../api/plans.api.js';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/format.js';

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState([]);
  const [changeTarget, setChangeTarget] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load(nextPage = page) {
    setLoading(true);
    setError('');
    try {
      const res = await listSubscriptions({
        page: nextPage,
        limit: 10,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setSubscriptions(res.data.data);
      setPagination(res.data.pagination);
      const planRes = await listPlans({ limit: 100 });
      setPlans(planRes.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load subscriptions'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); setPage(1); }, [statusFilter]);

  async function handleChangePlan() {
    if (!selectedPlanId) return toast.error('Choose a plan first');
    setBusy(true);
    try {
      await changePlan(changeTarget._id, { planId: selectedPlanId });
      toast.success('Plan changed');
      setChangeTarget(null);
      load(page);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change plan'));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    try {
      await cancelSubscription(cancelTarget._id);
      toast.success('Subscription cancelled');
      setCancelTarget(null);
      load(page);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not cancel subscription'));
    } finally {
      setBusy(false);
    }
  }

  const current = subscriptions.find((s) => ['active', 'pending'].includes(s.status));

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle="Your current subscription and full history."
        action={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm" aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        }
      />

      {loading && <SkeletonList />}
      {error && <ErrorState message={error} onRetry={() => load(page)} />}
      {!loading && !error && subscriptions.length === 0 && (
        <EmptyState icon={CreditCard} title="No subscriptions yet" message="Subscribe to a plan to see it here." action={<Link to="/plans" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Browse plans</Link>} />
      )}

      {!loading && !error && subscriptions.length > 0 && (
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <article key={sub._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {sub.plan?.name || 'Plan'}
                    {current?._id === sub._id && <span className="ml-2 text-xs font-semibold text-indigo-600">· Current</span>}
                  </h2>
                  <p className="text-sm text-gray-500">{sub.plan?.description}</p>
                </div>
                <StatusBadge status={sub.status} />
              </div>
              <dl className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-gray-400">Price</dt><dd className="font-medium text-gray-900">{formatCurrency(sub.price, sub.currency)} / {sub.billingInterval}</dd></div>
                <div><dt className="text-gray-400">Start date</dt><dd className="font-medium text-gray-900">{formatDate(sub.startDate)}</dd></div>
                <div><dt className="text-gray-400">End date</dt><dd className="font-medium text-gray-900">{formatDate(sub.endDate)}</dd></div>
                <div><dt className="text-gray-400">Next billing</dt><dd className="font-medium text-gray-900">{formatDate(sub.nextBillingDate)}</dd></div>
              </dl>
              {['active', 'pending'].includes(sub.status) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setChangeTarget(sub); setSelectedPlanId(''); }} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
                    Upgrade / downgrade
                  </button>
                  {sub.status === 'pending' && (
                    <Link to="/checkout" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Complete payment</Link>
                  )}
                  <button type="button" onClick={() => setCancelTarget(sub)} className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                    Cancel subscription
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <Pagination pagination={pagination} onPage={(p) => { setPage(p); load(p); }} />

      {changeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Change plan</h3>
            <p className="mt-1 text-sm text-gray-500">Choose a different active plan for this subscription.</p>
            <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className={`${inputClass} mt-4`}>
              <option value="">Select a plan…</option>
              {plans.filter((p) => p._id !== changeTarget.plan?._id).map((p) => (
                <option key={p._id} value={p._id}>{p.name} — {formatCurrency(p.price, p.currency)} / {p.billingInterval}</option>
              ))}
            </select>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setChangeTarget(null)} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium">Cancel</button>
              <button type="button" onClick={handleChangePlan} disabled={busy} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? 'Changing…' : 'Confirm change'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel subscription?"
        message="This will cancel your subscription immediately. You can subscribe again later from the plans page."
        confirmLabel="Yes, cancel"
        busy={busy}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />
    </div>
  );
}
