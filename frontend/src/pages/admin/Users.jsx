import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users as UsersIcon } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { SkeletonList } from '../../components/common/Skeleton.jsx';
import { listUsers, updateUserRole } from '../../api/users.api.js';
import { formatDate, getErrorMessage } from '../../utils/format.js';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(nextPage = page) {
    setLoading(true);
    setError('');
    try {
      const res = await listUsers({
        page: nextPage,
        limit: 10,
        ...(appliedSearch ? { search: appliedSearch } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load users'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); setPage(1); }, [appliedSearch, roleFilter]);

  async function handleRoleChange(user, role) {
    try {
      await updateUserRole(user._id, { role });
      toast.success(`${user.name} is now ${role}`);
      load(page);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change role'));
    }
  }

  return (
    <div>
      <PageHeader title="User management" subtitle="Search, filter, paginate, and change roles. Only admins can access this page." />
      <form
        onSubmit={(e) => { e.preventDefault(); setAppliedSearch(search.trim()); }}
        className="mb-5 flex flex-wrap gap-2"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="min-w-64 flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm" aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
        </select>
        <button type="submit" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Search</button>
      </form>

      {loading && <SkeletonList />}
      {error && <ErrorState message={error} onRetry={() => load(page)} />}
      {!loading && !error && users.length === 0 && (
        <EmptyState icon={UsersIcon} title="No users found" message="Try a different search or filter." />
      )}
      {!loading && !error && users.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-5 py-3 font-medium text-gray-900">{user.name}</td>
                  <td className="px-5 py-3">{user.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm capitalize"
                      aria-label={`Role for ${user.name}`}
                    >
                      <option value="customer">customer</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={pagination} onPage={(p) => { setPage(p); load(p); }} />
    </div>
  );
}
