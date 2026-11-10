import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Logo({ to = '/', dark = false }) {
  return (
    <Link to={to} className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
        <Zap className="h-5 w-5" />
      </span>
      <span className={`text-xl font-bold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
        PayFlow
      </span>
    </Link>
  );
}
