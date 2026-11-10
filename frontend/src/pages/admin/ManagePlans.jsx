import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { SkeletonList } from '../../components/common/Skeleton.jsx';
import { Field, inputClass } from '../../components/forms/AuthCard.jsx';
import {
  createPlan,
  deletePlan,
  listPlans,
  updatePlan,
} from '../../api/plans.api.js';
import { formatCurrency, getErrorMessage } from '../../utils/format.js';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  billingInterval: 'monthly',
  features: '',
  isActive: true,
};

export default function ManagePlans() {
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load(nextPage = page) {
    setLoading(true);
    setError('');
    try {
      const res = await listPlans({ all: true, page: nextPage, limit: 10 });
      setPlans(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load plans'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, []);

  function startEdit(plan) {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description,
      price: String(plan.price),
      billingInterval: plan.billingInterval,
      features: (plan.features || []).join(', '),
      isActive: plan.isActive,
    });
  }

  function startCreate() {
    setEditing(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error('Plan name must be at least 2 characters');
    if (form.description.trim().length < 10) return toast.error('Description must be at least 10 characters');
    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) return toast.error('Price must be a number of 0 or more');
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      billingInterval: form.billingInterval,
      features: form.features.split(',').map((f) => f.trim()).filter(Boolean),
      isActive: form.isActive,
    };
    setBusy(true);
    try {
      if (editing) await updatePlan(editing._id, payload);
      else await createPlan(payload);
      toast.success(editing ? 'Plan updated' : 'Plan created');
      startCreate();
      load(page);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save plan'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deletePlan(deleteTarget._id);
      toast.success('Plan deleted');
      setDeleteTarget(null);
      load(page);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete plan'));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(plan) {
    try {
      await updatePlan(plan._id, { isActive: !plan.isActive });
      toast.success(plan.isActive ? 'Plan deactivated' : 'Plan activated');
      load(page);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update plan'));
    }
  }

  return (
    <div>
      <PageHeader title="Manage plans" subtitle="Create, edit, delete, and activate or deactivate plans." />
      <div className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:col-span-1">
          <h2 className="font-semibold text-gray-900">{editing ? 'Edit plan' : 'Create plan'}</h2>
          <Field label="Name">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price">
              <input type="number" min="0" step="any" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} required />
            </Field>
            <Field label="Billing interval">
              <select value={form.billingInterval} onChange={(e) => setForm({ ...form, billingInterval: e.target.value })} className={inputClass}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </Field>
          </div>
          <Field label="Features (comma-separated)">
            <input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Unlimited projects, Priority support" className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active (visible to customers)
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="flex-1 rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create plan'}
            </button>
            {editing && (
              <button type="button" onClick={startCreate} className="rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium">Cancel edit</button>
            )}
          </div>
        </form>

        <div className="lg:col-span-2">
          {loading && <SkeletonList />}
          {error && <ErrorState message={error} onRetry={() => load(page)} />}
          {!loading && !error && plans.length === 0 && (
            <EmptyState icon={Sparkles} title="No plans yet" message="Create your first plan with the form." />
          )}
          {!loading && !error && plans.length > 0 && (
            <div className="space-y-4">
              {plans.map((plan) => (
                <article key={plan._id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                      <p className="mt-1 text-sm font-medium">{formatCurrency(plan.price, plan.currency)} / {plan.billingInterval}</p>
                      <p className="mt-1 text-xs text-gray-400">{(plan.features || []).join(' · ') || 'No features listed'}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${plan.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => startEdit(plan)} className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium">Edit</button>
                    <button type="button" onClick={() => toggleActive(plan)} className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium">
                      {plan.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(plan)} className="rounded-full border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600">Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <Pagination pagination={pagination} onPage={(p) => { setPage(p); load(p); }} />
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete plan?"
        message={`This permanently deletes "${deleteTarget?.name}". Existing subscriptions keep their own plan snapshot, but new customers will no longer see this plan.`}
        confirmLabel="Yes, delete"
        busy={busy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
