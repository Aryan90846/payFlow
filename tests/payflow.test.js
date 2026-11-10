import { jest } from '@jest/globals';
import request from 'supertest';
import crypto from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Plan } from '../src/models/Plan.js';
import { Subscription } from '../src/models/Subscription.js';
import { expireSubscriptions } from '../src/services/expiry.service.js';

let mongo;

jest.setTimeout(120000);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

async function makeAdmin() {
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@payflow.local',
    password: 'admin123',
    role: 'admin',
  });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@payflow.local', password: 'admin123' });
  return { admin, token: res.body.data.token };
}

async function makeCustomer(email = 'customer@payflow.local') {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Customer', email, password: 'password123' });
  return { token: res.body.data.token, userId: res.body.data.user._id };
}

async function makePlan(adminToken, overrides = {}) {
  const res = await request(app)
    .post('/api/v1/plans')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Pro',
      description: 'For growing teams and projects',
      price: 499,
      billingInterval: 'monthly',
      features: ['Unlimited projects'],
      ...overrides,
    });
  return res.body.data.plan;
}

describe('auth', () => {
  test('registers a user and returns a token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Aarav', email: 'aarav@example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('customers cannot assign themselves the admin role', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Sneaky', email: 'sneaky@example.com', password: 'password123', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('customer');
  });

  test('rejects duplicate registration and wrong login', async () => {
    await makeCustomer();
    const dup = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Again', email: 'customer@payflow.local', password: 'password123' });
    expect(dup.status).toBe(409);
    const badLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@payflow.local', password: 'wrongpassword' });
    expect(badLogin.status).toBe(401);
  });

  test('rejects protected routes without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  test('forgot password returns the same message and reset works with a valid token', async () => {
    await makeCustomer();
    const forgot = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'customer@payflow.local' });
    expect(forgot.status).toBe(200);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const user = await User.findOne({ email: 'customer@payflow.local' });
    user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const reset = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, password: 'newpassword123' });
    expect(reset.status).toBe(200);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@payflow.local', password: 'newpassword123' });
    expect(login.status).toBe(200);
  });
});

describe('plans and authorization', () => {
  test('admin can create a plan, customer cannot', async () => {
    const { token: adminToken } = await makeAdmin();
    const { token: customerToken } = await makeCustomer();
    const created = await makePlan(adminToken);
    expect(created.name).toBe('Pro');

    const forbiddenRes = await request(app)
      .post('/api/v1/plans')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Nope', description: 'Should not be created here', price: 1, billingInterval: 'monthly' });
    expect(forbiddenRes.status).toBe(403);
  });

  test('customers only see active plans', async () => {
    const { token: adminToken } = await makeAdmin();
    await makePlan(adminToken, { name: 'Active Plan' });
    await makePlan(adminToken, { name: 'Hidden Plan', isActive: false });
    const res = await request(app).get('/api/v1/plans');
    expect(res.body.data.map((p) => p.name)).toEqual(['Active Plan']);
  });
});

describe('subscriptions, payments and invoices', () => {
  test('full happy path: subscribe, pay, invoice paid, dashboard counts it', async () => {
    const { token: adminToken } = await makeAdmin();
    const { token: customerToken } = await makeCustomer();
    const plan = await makePlan(adminToken);

    const subRes = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ planId: plan._id });
    expect(subRes.status).toBe(201);
    expect(subRes.body.data.subscription.status).toBe('pending');
    const subscriptionId = subRes.body.data.subscription._id;

    const dup = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ planId: plan._id });
    expect(dup.status).toBe(409);

    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ subscriptionId });
    expect(payRes.status).toBe(201);
    expect(payRes.body.data.payment.status).toBe('succeeded');
    expect(payRes.body.data.payment.transactionRef).toMatch(/^TXN-/);

    const current = await request(app)
      .get('/api/v1/subscriptions/me/current')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(current.body.data.subscription.status).toBe('active');

    const invoices = await request(app)
      .get('/api/v1/invoices')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(invoices.body.data[0].paymentStatus).toBe('paid');
    expect(invoices.body.data[0].invoiceNumber).toMatch(/^INV-/);

    const secondPay = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ subscriptionId });
    expect(secondPay.status).toBe(409);

    const dashboard = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(dashboard.body.data.totalCustomers).toBe(1);
    expect(dashboard.body.data.totalActiveSubscriptions).toBe(1);
    expect(dashboard.body.data.totalRevenue).toBe(499);
    expect(dashboard.body.data.subscriptionDistribution).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: 'active', count: 1 })])
    );
  });

  test('simulated payment failure keeps subscription pending and invoice failed', async () => {
    const { token: adminToken } = await makeAdmin();
    const { token: customerToken } = await makeCustomer();
    const plan = await makePlan(adminToken);
    const sub = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ planId: plan._id });
    const pay = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ subscriptionId: sub.body.data.subscription._id, simulate: 'failure' });
    expect(pay.body.data.payment.status).toBe('failed');
    const current = await request(app)
      .get('/api/v1/subscriptions/me/current')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(current.body.data.subscription.status).toBe('pending');
  });

  test('idempotency key replays the original payment instead of charging twice', async () => {
    const { token: adminToken } = await makeAdmin();
    const { token: customerToken } = await makeCustomer();
    const plan = await makePlan(adminToken);
    const sub = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ planId: plan._id });
    const first = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ subscriptionId: sub.body.data.subscription._id, idempotencyKey: 'key-123' });
    const replay = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ subscriptionId: sub.body.data.subscription._id, idempotencyKey: 'key-123' });
    expect(replay.body.data.replayed).toBe(true);
    expect(replay.body.data.payment._id).toBe(first.body.data.payment._id);
  });

  test('upgrade, cancellation, and invoice access control', async () => {
    const { token: adminToken } = await makeAdmin();
    const { token: customerToken } = await makeCustomer();
    const { token: otherToken } = await makeCustomer('other@payflow.local');
    const basic = await makePlan(adminToken, { name: 'Basic', price: 199 });
    const pro = await makePlan(adminToken, { name: 'Pro', price: 499 });
    const sub = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ planId: basic._id });
    const subscriptionId = sub.body.data.subscription._id;
    await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ subscriptionId });

    const upgraded = await request(app)
      .put(`/api/v1/subscriptions/${subscriptionId}/change-plan`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ planId: pro._id });
    expect(upgraded.body.data.subscription.price).toBe(499);

    const invoices = await request(app)
      .get('/api/v1/invoices')
      .set('Authorization', `Bearer ${customerToken}`);
    const otherAccess = await request(app)
      .get(`/api/v1/invoices/${invoices.body.data[0]._id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(otherAccess.status).toBe(403);

    const cancelled = await request(app)
      .put(`/api/v1/subscriptions/${subscriptionId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(cancelled.body.data.subscription.status).toBe('cancelled');

    const history = await request(app)
      .get('/api/v1/subscriptions?status=cancelled')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(history.body.data).toHaveLength(1);
  });

  test('expiry service marks past-due active subscriptions as expired', async () => {
    const { token: adminToken } = await makeAdmin();
    const { token: customerToken } = await makeCustomer();
    const plan = await makePlan(adminToken);
    const sub = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ planId: plan._id });
    await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ subscriptionId: sub.body.data.subscription._id });
    await Subscription.findByIdAndUpdate(sub.body.data.subscription._id, {
      endDate: new Date(Date.now() - 1000),
    });
    const result = await expireSubscriptions();
    expect(result.expiredCount).toBe(1);
    const updated = await Subscription.findById(sub.body.data.subscription._id);
    expect(updated.status).toBe('expired');

    const dashboardForbidden = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(dashboardForbidden.status).toBe(403);
  });
});
