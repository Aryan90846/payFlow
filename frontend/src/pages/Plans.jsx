import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import PlanCard from '../components/common/PlanCard.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { SkeletonList } from '../components/common/Skeleton.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import { listPlans } from '../api/plans.api.js';
import { getErrorMessage } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [interval, setInterval] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await listPlans({ limit: 100, ...(interval ? { billingInterval: interval } : {}) });
      setPlans(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load plans'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [interval]);

  function handleSubscribe(plan) {
    if (!user) {
      toast('Please log in to subscribe');
      navigate('/login');
      return;
    }
    navigate(`/checkout?planId=${plan._id}`);
  }

  return (
    <div className={user ? '' : 'mx-auto max-w-7xl px-4 py-10 sm:px-6'}>
      <PageHeader
        title="Plans"
        subtitle="Choose a plan. Prices and billing intervals come straight from the backend."
        action={
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm"
            aria-label="Filter by billing interval"
          >
            <option value="">All intervals</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        }
      />
      {loading && <SkeletonList />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && plans.length === 0 && (
        <EmptyState icon={Sparkles} title="No active plans" message="No plans match this filter yet. Try another interval, or check back later." />
      )}
      {!loading && !error && plans.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <PlanCard key={plan._id} plan={plan} recommended={i === 1 && plans.length > 1} onSubscribe={handleSubscribe} />
          ))}
        </div>
      )}
    </div>
  );
}
