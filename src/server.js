import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { expireSubscriptions } from './services/expiry.service.js';

async function seedAdmin() {
  if (!env.admin.email || !env.admin.password) return;
  const existing = await User.findOne({ email: env.admin.email });
  if (existing) return;
  await User.create({
    name: env.admin.name,
    email: env.admin.email,
    password: env.admin.password,
    role: 'admin',
  });
  // eslint-disable-next-line no-console
  console.log(`Seeded admin account: ${env.admin.email}`);
}

async function start() {
  await connectDB();
  await seedAdmin();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`PayFlow running on port ${env.port} (docs: /api-docs)`);
  });
  // Daily expiry check. The admin endpoint provides the same check on demand.
  setInterval(() => {
    expireSubscriptions().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Expiry check failed:', error.message);
    });
  }, 24 * 60 * 60 * 1000);
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start PayFlow:', error.message);
  process.exit(1);
});
