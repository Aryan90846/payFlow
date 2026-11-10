import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { Skeleton } from '../components/common/Skeleton.jsx';
import { inputClass } from '../components/forms/AuthCard.jsx';
import { getPlan } from '../api/plans.api.js';
import {
  createSubscription,
  getCurrentSubscription,
} from '../api/subscriptions.api.js';
import { createPayment } from '../api/payments.api.js';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/format.js';

export default function Checkout() {
  const [params] = useSearchParams();
  const planId = params.get('planId');
  const [plan, setPlan] = useState(null);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [simulate, setSimulate] = useState('success');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const currentRes = await getCurrentSubscription().catch((err) => {
        if (err.response?.status === 404) return null;
        throw err;
      });
      setCurrent(currentRes?.data.data.subscription || null);
      if (planId) {
        const planRes = await getPlan(planId);
        setPlan(planRes.data.data.plan);
      } else if (currentRes?.data.data.subscription) {
        setPlan(currentRes.data.data.subscription.plan);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load checkout'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [planId]);

  async function handlePay() {
    if (!plan) return;
    // A live subscription already exists: pay for it instead of creating a second one.
    if (current && current.status === 'active') {
      toast('You already have an active subscription');
      return;
    }
    setProcessing(true);
    setResult(null);
    try {
      let subscription = current;
      if (!subscription) {
        const subRes = await createSubscription({ planId: plan._id });
        subscription = subRes.data.data.subscription;
        setCurrent(subscription);
      }
      const payRes = await createPayment({
        subscriptionId: subscription._id,
        paymentMethod,
        simulate,
        idempotencyKey: `checkout-${subscription._id}-${Date.now()}`,
      });
      const payment = payRes.data.data.payment;
      setResult({ payment, succeeded: payment.status === 'succeeded' });
      if (payment.status === 'succeeded') toast.success('Payment successful');
      else toast.error('Simulated payment failed');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Payment could not be completed'));
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <Skeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!plan) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
        <p className="font-semibold text-gray-900">No plan selected</p>
        <p className="mt-1 text-sm text-gray-500">Choose a plan first, then come back to checkout.</p>
        <Link to="/plans" className="mt-4 inline-block rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Browse plans</Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
        {result.succeeded ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        ) : (
          <XCircle className="mx-auto h-14 w-14 text-red-500" />
        )}
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {result.succeeded ? 'Payment successful' : 'Payment failed'}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {result.succeeded
            ? 'Your subscription is now active. You can view it on the subscriptions page.'
            : 'This was a simulated failure. Your subscription stays pending and you can try again.'}
        </p>
        <dl className="mt-6 space-y-2 text-left text-sm">
          <div className="flex justify-between"><dt className="text-gray-400">Transaction reference</dt><dd className="font-medium">{result.payment.transactionRef}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-400">Amount</dt><dd className="font-medium">{formatCurrency(result.payment.amount, result.payment.currency)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-400">Status</dt><dd className="font-medium capitalize">{result.payment.status}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-400">Method</dt><dd className="font-medium capitalize">{result.payment.paymentMethod}</dd></div>
        </dl>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/subscriptions" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">View subscription</Link>
          {!result.succeeded && (
            <button type="button" onClick={() => setResult(null)} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium">Try again</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Checkout" subtitle="Simulated payment — no real money moves and no card details are collected." />
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Simulation only.</strong> Choose a payment method and whether the simulated payment
            should succeed or fail. PayFlow never asks for a card number, expiry, or CVV.
          </span>
        </p>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-semibold text-gray-900">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><dt>Plan</dt><dd className="font-medium text-gray-900">{plan.name}</dd></div>
            <div className="flex justify-between"><dt>Billing</dt><dd className="font-medium text-gray-900 capitalize">{plan.billingInterval}</dd></div>
            {current && (
              <div className="flex justify-between"><dt>Existing subscription</dt><dd className="font-medium text-gray-900 capitalize">{current.status}</dd></div>
            )}
            {current && (
              <div className="flex justify-between"><dt>Current period ends</dt><dd className="font-medium text-gray-900">{formatDate(current.endDate)}</dd></div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-3"><dt className="font-semibold text-gray-900">Total due</dt><dd className="font-bold text-gray-900">{formatCurrency(plan.price, plan.currency)}</dd></div>
          </dl>
          {current?.status === 'active' && (
            <p className="mt-4 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-800">
              You already have an active subscription. To switch plans, use upgrade/downgrade on the subscriptions page.
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-semibold text-gray-900">Payment method (simulated)</h2>
          <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="method">Method</label>
          <select id="method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={`${inputClass} mt-1`}>
            <option value="card">Card (simulated)</option>
            <option value="upi">UPI (simulated)</option>
            <option value="netbanking">Net banking (simulated)</option>
          </select>
          <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="simulate">Simulated outcome</label>
          <select id="simulate" value={simulate} onChange={(e) => setSimulate(e.target.value)} className={`${inputClass} mt-1`}>
            <option value="success">Success</option>
            <option value="failure">Failure (to test the failure screen)</option>
          </select>
          <button
            type="button"
            onClick={handlePay}
            disabled={processing || current?.status === 'active'}
            className="mt-6 w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {processing ? 'Processing simulated payment…' : `Pay ${formatCurrency(plan.price, plan.currency)} (simulated)`}
          </button>
          <p className="mt-3 text-center text-xs text-gray-400">No card details are entered or stored anywhere in this flow.</p>
        </section>
      </div>
    </div>
  );
}
