import crypto from 'node:crypto';

export function addBillingPeriod(startDate, billingInterval) {
  const end = new Date(startDate);
  if (billingInterval === 'yearly') end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

export function generateInvoiceNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `INV-${stamp}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function generateTransactionRef() {
  return `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}
