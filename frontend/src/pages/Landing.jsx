import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Check,
  CreditCard,
  FileText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import PlanCard from '../components/common/PlanCard.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { SkeletonList } from '../components/common/Skeleton.jsx';
import { listPlans } from '../api/plans.api.js';
import { getErrorMessage } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

const features = [
  { icon: Sparkles, title: 'Plans in minutes', text: 'Create monthly and yearly plans with features, pricing, and active status — no billing code to write.' },
  { icon: CreditCard, title: 'Simulated checkout', text: 'Try the full subscribe-and-pay flow safely. Payments are simulated, so no real money or card details are involved.' },
  { icon: FileText, title: 'Invoices, automatically', text: 'Every subscription generates an invoice with a unique number, amount, and payment status.' },
  { icon: BarChart3, title: 'Revenue at a glance', text: 'Admins see customers, active subscriptions, monthly revenue, and subscription mix in one dashboard.' },
  { icon: ShieldCheck, title: 'Built-in access control', text: 'Customers only ever see their own subscriptions, payments, and invoices. Admin pages are role-gated.' },
  { icon: Check, title: 'Expiry handled', text: 'Past-due subscriptions are marked expired by a scheduled check or on demand by an admin.' },
];

export default function Landing() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadPlans() {
    setLoading(true);
    setError('');
    try {
      const res = await listPlans({ limit: 100 });
      setPlans(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load plans'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPlans(); }, []);

  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" /> Subscription & billing, simplified
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Manage subscriptions and billing without the billing headache
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-500">
          PayFlow lets customers discover plans, subscribe, pay, and track invoices — and gives admins
          a clear view of revenue and subscribers. All payments are simulated, so you can explore safely.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={user ? '/dashboard' : '/register'} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/plans" className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            View pricing
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-400">No real payment gateway. No card details collected.</p>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold text-gray-900">Everything billing needs, in one place</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold text-gray-900">Pricing preview</h2>
        <p className="mt-1 text-sm text-gray-500">Live plans from the PayFlow backend. Sign in to subscribe.</p>
        <div className="mt-8">
          {loading && <SkeletonList />}
          {error && <ErrorState message={error} onRetry={loadPlans} />}
          {!loading && !error && plans.length === 0 && (
            <p className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500">
              No active plans yet. An admin can create plans from the admin dashboard.
            </p>
          )}
          {!loading && !error && plans.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan, i) => (
                <PlanCard key={plan._id} plan={plan} recommended={i === 1 && plans.length > 1} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold text-gray-900">How it works</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ['1. Pick a plan', 'Browse active plans and choose monthly or yearly billing.'],
            ['2. Subscribe & pay', 'A subscription and invoice are created, then you complete the simulated payment.'],
            ['3. Track everything', 'See your subscription, payments, and invoices — and admins see the business picture.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <p className="text-sm font-semibold text-gray-900">PayFlow</p>
          <p className="text-xs text-gray-400">Subscription & Billing Management System · Payments are simulated.</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link to="/login" className="hover:text-gray-900">Log in</Link>
            <Link to="/plans" className="hover:text-gray-900">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
