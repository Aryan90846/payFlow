export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      {Icon && <Icon className="mx-auto h-10 w-10 text-gray-400" />}
      <h3 className="mt-3 text-base font-semibold text-gray-900">{title}</h3>
      {message && <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
