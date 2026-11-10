import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Receipt,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const customerLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/plans', label: 'Plans', icon: Sparkles },
  { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const adminLinks = [
  { to: '/admin', label: 'Admin dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/plans', label: 'Manage plans', icon: Sparkles },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar({ open, onClose }) {
  const { isAdmin } = useAuth();
  const links = isAdmin ? [...adminLinks, ...customerLinks] : customerLinks;
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-lg transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
          <Logo to={isAdmin ? '/admin' : '/dashboard'} />
          <button type="button" onClick={onClose} aria-label="Close menu" className="text-gray-400 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {isAdmin && <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Admin</p>}
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard' || to === '/admin'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="border-t border-gray-100 p-4 text-xs text-gray-400">
          Payments on PayFlow are simulated — no real money moves.
        </p>
      </aside>
    </>
  );
}
