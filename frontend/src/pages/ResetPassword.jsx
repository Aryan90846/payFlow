import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthCard, { Field, inputClass } from '../components/forms/AuthCard.jsx';
import PasswordField from '../components/forms/PasswordField.jsx';
import { resetPassword } from '../api/auth.api.js';
import { getErrorMessage } from '../utils/format.js';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setBusy(true);
    try {
      const res = await resetPassword({ token: token.trim(), password });
      toast.success(res.data.message);
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Password reset failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle="Paste the token from your reset email, then choose a new password."
      footer={<Link to="/login" className="font-semibold text-indigo-600 hover:underline">Back to login</Link>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Reset token">
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token from your email" className={inputClass} required />
        </Field>
        <Field label="New password">
          <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" autoComplete="new-password" />
        </Field>
        <button type="submit" disabled={busy} className="w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          {busy ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthCard>
  );
}
