import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthCard, { Field, inputClass } from '../components/forms/AuthCard.jsx';
import { forgotPassword } from '../api/auth.api.js';
import { getErrorMessage } from '../utils/format.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await forgotPassword({ email });
      setSent(true);
      toast.success(res.data.message);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not send reset instructions'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email and we will send you a reset token if an account exists."
      footer={<Link to="/login" className="font-semibold text-indigo-600 hover:underline">Back to login</Link>}
    >
      {sent ? (
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-semibold">Check your email</p>
          <p className="mt-1">
            If an account exists for {email}, a reset token has been sent. Copy that token into the{' '}
            <Link to="/reset-password" className="font-semibold underline">reset password page</Link>.
          </p>
          <p className="mt-2 text-xs text-emerald-700">
            Note: if email is not configured on the backend, the token is logged to the backend console in development.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} required />
          </Field>
          <button type="submit" disabled={busy} className="w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {busy ? 'Sending…' : 'Send reset token'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
