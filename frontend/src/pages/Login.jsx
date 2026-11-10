import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthCard, { Field, inputClass } from '../components/forms/AuthCard.jsx';
import PasswordField from '../components/forms/PasswordField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../utils/format.js';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setBusy(true);
    try {
      const nextUser = await login({ email, password });
      toast.success(`Welcome back, ${nextUser.name}`);
      // Return to the page the user was trying to reach, unless an admin
      // was sent to a customer-only page (then the admin dashboard wins).
      navigate(redirectTo && (nextUser.role === 'admin' || !redirectTo.startsWith('/admin')) ? redirectTo : (nextUser.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to manage your subscriptions and billing."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:underline">Create one</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} required />
        </Field>
        <Field label="Password">
          <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:underline">Forgot password?</Link>
        </div>
        <button type="submit" disabled={busy} className="w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthCard>
  );
}
