import DashboardLayout from './DashboardLayout.jsx';

// Admin pages share the dashboard shell; the sidebar already shows the
// admin section first for admin users, and AdminRoute guards these routes.
export default function AdminLayout() {
  return <DashboardLayout />;
}
