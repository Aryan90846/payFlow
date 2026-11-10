export function getErrorMessage(error, fallback = 'Something went wrong') {
  const data = error?.response?.data;
  if (data?.details?.length) {
    return data.details.map((d) => `${d.field}: ${d.message}`).join(' ');
  }
  // Axios reports a backend that is not running (or not reachable) as a
  // bare "Network Error" with no response. Say so plainly instead of
  // showing that cryptic text, especially on the landing pricing preview.
  if (!error?.response && (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error')) {
    return 'Could not reach the backend at http://localhost:5000. Please start the backend (npm run dev) and reload the page.';
  }
  return data?.message || error?.message || fallback;
}

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
