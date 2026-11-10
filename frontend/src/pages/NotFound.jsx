import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function NotFound() {
  const { user, isAdmin } = useAuth();
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-6xl font-bold text-indigo-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-sm text-gray-500">
        This address does not match any PayFlow page. It may have been typed
        incorrectly, or the link may be out of date.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
          Go to home
        </Link>
        {user && (
          <Link to={isAdmin ? '/admin' : '/dashboard'} className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium">
            Go to dashboard
          </Link>
        )}
        <Link to="/plans" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium">
          View plans
        </Link>
      </div>
    </div>
  );
}
