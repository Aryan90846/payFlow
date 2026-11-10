import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/format.js';

export default function PlanCard({ plan, recommended, actionLabel = 'Subscribe', onSubscribe }) {
  return (
    <div
      className={`flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ${
        recommended ? 'ring-2 ring-indigo-600' : 'ring-gray-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
        {recommended && (
          <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            Recommended
          </span>
        )}
      </div>
      <p className="mt-2 min-h-10 text-sm text-gray-500">{plan.description}</p>
      <p className="mt-4">
        <span className="text-3xl font-bold text-gray-900">{formatCurrency(plan.price, plan.currency)}</span>
        <span className="text-sm text-gray-500"> / {plan.billingInterval === 'yearly' ? 'year' : 'month'}</span>
      </p>
      <ul className="mt-5 flex-1 space-y-2">
        {(plan.features || []).map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            {feature}
          </li>
        ))}
        {(!plan.features || plan.features.length === 0) && (
          <li className="text-sm text-gray-400">No features listed for this plan.</li>
        )}
      </ul>
      {onSubscribe ? (
        <button
          type="button"
          onClick={() => onSubscribe(plan)}
          className="mt-6 w-full rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {actionLabel}
        </button>
      ) : (
        <Link
          to={`/checkout?planId=${plan._id}`}
          className="mt-6 block w-full rounded-full bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
