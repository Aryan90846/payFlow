import { Link, Outlet } from 'react-router-dom';
import Logo from '../components/layout/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function PublicLayout() {
  const { user, isAdmin } = useAuth();
  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            {/* Pricing is a real page (/plans), not the landing section:
                the old "/#pricing" anchor kept users on the landing page
                and looked like navigation was broken. */}
            <Link to="/#features" className="hover:text-gray-900">Features</Link>
            <Link to="/plans" className="hover:text-gray-900">Pricing</Link>
            <Link to="/#how-it-works" className="hover:text-gray-900">How it works</Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                  Log in
                </Link>
                <Link to="/register" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
