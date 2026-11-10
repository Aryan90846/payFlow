const styles = {
  active: 'bg-emerald-100 text-emerald-800',
  succeeded: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  unpaid: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-gray-200 text-gray-700',
  expired: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-100 text-red-800',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        styles[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {status}
    </span>
  );
}
