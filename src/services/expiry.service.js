import { Subscription } from '../models/Subscription.js';

// Finds active subscriptions past their end date and marks them expired.
// Safe to run repeatedly: expired subscriptions are never matched again.
export async function expireSubscriptions(now = new Date()) {
  const result = await Subscription.updateMany(
    { status: 'active', endDate: { $lt: now } },
    { $set: { status: 'expired' } }
  );
  return { expiredCount: result.modifiedCount };
}
