import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/common/PageHeader.jsx';
import { Field, inputClass } from '../components/forms/AuthCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { updateProfile } from '../api/users.api.js';
import { formatDate, getErrorMessage } from '../utils/format.js';

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [busy, setBusy] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error('Name must be at least 2 characters');
    setBusy(true);
    try {
      const res = await updateProfile({ name: name.trim() });
      setUser(res.data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update profile'));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account. Email and role cannot be changed from this page — only an admin can change a role." />
      <form onSubmit={handleSave} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <Field label="Full name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </Field>
        <Field label="Email">
          <input value={user?.email || ''} className={`${inputClass} bg-gray-50`} disabled />
        </Field>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-400">Role</p><p className="font-medium capitalize">{user?.role}</p></div>
          <div><p className="text-gray-400">Account created</p><p className="font-medium">{formatDate(user?.createdAt)}</p></div>
        </div>
        <button type="submit" disabled={busy} className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
      <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="font-semibold text-gray-900">Session</h2>
        <p className="mt-1 text-sm text-gray-500">
          Logging out clears your token from this browser. The backend uses stateless JWTs, so there is no server-side session to revoke.
        </p>
        <button type="button" onClick={handleLogout} className="mt-4 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
          Log out
        </button>
      </div>
    </div>
  );
}
