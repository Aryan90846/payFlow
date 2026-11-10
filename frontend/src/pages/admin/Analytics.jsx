import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { SkeletonList } from '../../components/common/Skeleton.jsx';
import { getDashboard } from '../../api/admin.api.js';
import { formatCurrency, getErrorMessage } from '../../utils/format.js';
import { Users, Sparkles, Wallet } from 'lucide-react';

const pieColors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await getDashboard();
      setData(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load analytics'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <SkeletonList />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const monthly = data.monthlyRevenue.map((row) => ({
    label: `${row.year}-${String(row.month).padStart(2, '0')}`,
    revenue: row.revenue,
    payments: row.payments,
  }));

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Revenue and subscription mix from the admin dashboard endpoint." />
      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard icon={Users} label="Total customers" value={data.totalCustomers} />
        <StatCard icon={Sparkles} label="Active subscriptions" value={data.totalActiveSubscriptions} />
        <StatCard icon={Wallet} label="Total revenue" value={formatCurrency(data.totalRevenue)} hint="Successful simulated payments only" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-semibold text-gray-900">Monthly revenue</h2>
          {monthly.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No successful payments yet, so there is no monthly revenue to chart.</p>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-semibold text-gray-900">Subscriptions by status</h2>
          {data.subscriptionDistribution.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No subscriptions yet.</p>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.subscriptionDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {data.subscriptionDistribution.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
