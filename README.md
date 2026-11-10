# PayFlow — Subscription & Billing Management System

A backend for managing subscription plans, customer subscriptions, simulated
payments, invoices, and admin analytics. Built as an intermediate-level
portfolio project: straightforward controllers, routes, services, models,
middleware, and validators — no over-engineered abstractions.

## Features

- **Authentication:** registration, login, logout, JWT auth, bcrypt password
  hashing, forgot/reset password, protected routes, role-based access
  (`admin`, `customer`). Customers can never assign themselves `admin` at
  registration; only an existing admin can change a role.
- **Plans:** admins create, update, delete, and view all plans; customers see
  only active plans. Plans have name, description, price, billing interval
  (`monthly`/`yearly`), features, and active status.
- **Subscriptions:** subscribe, view current subscription, upgrade/downgrade,
  cancel, and view history. Statuses: `active`, `cancelled`, `expired`,
  `pending`. One active or pending subscription per customer is enforced.
- **Payment simulation:** no real gateway. A payment record is created with a
  unique transaction reference, marked succeeded or failed, and linked to a
  subscription and invoice. Replaying an `idempotencyKey` returns the
  original payment instead of charging twice, and an already-paid invoice
  cannot be paid again.
- **Invoices:** generated automatically when a subscription is created, with
  an `INV-` number, customer, plan, amount, billing date, and payment status
  (`paid`/`unpaid`/`failed`). Customers see only their own invoices; admins
  see all.
- **Dashboard analytics:** total customers, total active subscriptions, total
  revenue from successful simulated payments, monthly revenue summary, and
  subscription distribution by status — all via MongoDB aggregation.
- **Email notifications:** registration, subscription confirmation, payment
  success/failure, and cancellation via Nodemailer. If SMTP is not
  configured, emails are logged to the console and the app keeps running.
- **Subscription expiry:** a service marks past-due active subscriptions as
  `expired`. Run it on demand via `POST /api/v1/admin/expire-subscriptions`
  (admin) or let the daily check in `server.js` run it.

## Tech stack

Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Zod, Nodemailer, Jest,
Supertest, Swagger/OpenAPI, Docker, dotenv, Helmet, Morgan,
express-rate-limit. JavaScript ES Modules.

## Architecture

```
src/
  config/       env.js (validated env vars), db.js
  controllers/  one controller per resource, small functions
  middleware/   authenticate, authorize, validate (Zod), errorHandler, rateLimit
  models/       User, Plan, Subscription, Payment, Invoice
  routes/       auth, users, plans, subscriptions, payments, invoices, admin
  services/     email.service.js, billing.service.js, expiry.service.js
  utils/        ApiError, asyncHandler, pagination
  app.js        Express app (no DB connection, so tests can import it)
  server.js     DB connection, optional admin seed, daily expiry check
tests/          Jest + Supertest integration tests (in-memory MongoDB)
docs/           openapi.yaml (served at /api-docs)
```

All API routes live under `/api/v1` and return a consistent shape:

```json
{ "success": true, "data": { "...": "..." }, "pagination": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 } }
```

Errors look like `{ "success": false, "message": "..." }` and, for validation
failures, include a `details` array with `field` and `message`.

## Installation

```bash
cd payflow
cp .env.example .env
npm install
```

Edit `.env` — at minimum set a real `JWT_SECRET`. Then start MongoDB locally
(or use Docker below) and run:

```bash
npm run dev    # with file watching
npm start      # production-style
```

Health check: `GET http://localhost:5000/health`
API docs: `http://localhost:5000/api-docs`

### Creating an admin account

Option 1 — set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` before the first
start; the account is seeded once, then change its password after login.

Option 2 — register a normal account, then promote it directly in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } });
```

## Environment configuration

See `.env.example`. Variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No (default 5000) | Server port |
| `MONGO_URI` | No (default `mongodb://localhost:27017/payflow`) | MongoDB connection |
| `JWT_SECRET` | Yes in production | JWT signing secret |
| `JWT_EXPIRES_IN` | No (default `1d`) | Token lifetime |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | No | Email. Leave empty to log emails to console instead |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | No | Optional first admin seed |

Never commit `.env` — it is in `.gitignore`.

### Configuring email

Use any SMTP provider (for local testing, a service like Mailtrap works well):

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-username
SMTP_PASS=your-password
EMAIL_FROM=PayFlow <no-reply@payflow.local>
```

With no SMTP values, registration, subscription, payment, and cancellation
still succeed; the email text is printed to the server console.

## Docker setup

```bash
cp .env.example .env   # edit JWT_SECRET at minimum
docker compose up --build
```

This starts MongoDB on port 27017 and the API on port 5000. The compose file
overrides `MONGO_URI` to point at the `mongo` service. Stop with
`docker compose down` (add `-v` to also delete the database volume).

## API endpoints

Base URL: `http://localhost:5000/api/v1`. `Auth` means a
`Authorization: Bearer <token>` header is required.

| Method & path | Access | Description |
| --- | --- | --- |
| POST `/auth/register` | Public | Register (always as customer) |
| POST `/auth/login` | Public, rate-limited | Login, returns JWT |
| POST `/auth/logout` | Auth | Logout (client discards token) |
| GET `/auth/me` | Auth | Current user |
| POST `/auth/forgot-password` | Public, rate-limited | Request reset token |
| POST `/auth/reset-password` | Public, rate-limited | Reset with token |
| GET `/users/me` | Auth | My profile |
| PUT `/users/me` | Auth | Update my name |
| GET `/users` | Admin | List users (search, role filter, pagination) |
| GET `/users/:id` | Admin | Get a user |
| PUT `/users/:id/role` | Admin | Change a user's role |
| GET `/plans` | Public | Active plans (`?all=true` for admins, search/filter) |
| GET `/plans/:id` | Public | Get a plan |
| POST `/plans` | Admin | Create a plan |
| PUT `/plans/:id` | Admin | Update a plan |
| DELETE `/plans/:id` | Admin | Delete a plan |
| POST `/subscriptions` | Auth (customer) | Subscribe to a plan |
| GET `/subscriptions` | Auth | Own subscriptions (all for admin), filter by status |
| GET `/subscriptions/me/current` | Auth | Current active/pending subscription |
| GET `/subscriptions/:id` | Owner/Admin | Get a subscription |
| PUT `/subscriptions/:id/change-plan` | Owner/Admin | Upgrade/downgrade |
| PUT `/subscriptions/:id/cancel` | Owner/Admin | Cancel |
| POST `/payments` | Auth | Simulated payment for a subscription |
| GET `/payments` | Auth | Own payments (all for admin) |
| GET `/payments/:id` | Owner/Admin | Get a payment |
| GET `/invoices` | Auth | Own invoices (all for admin) |
| GET `/invoices/:id` | Owner/Admin | Get an invoice |
| GET `/admin/dashboard` | Admin | Analytics |
| POST `/admin/expire-subscriptions` | Admin | Run expiry check |

Pagination: `?page=1&limit=10` on list endpoints.

## Authentication

Register, then log in:

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Aarav Sharma","email":"aarav@example.com","password":"password123"}'

curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aarav@example.com","password":"password123"}'
```

Use the returned token on later requests:

```bash
curl http://localhost:5000/api/v1/subscriptions/me/current \
  -H "Authorization: Bearer <token>"
```

## Example requests and responses

**Create a plan (admin):**

```bash
curl -X POST http://localhost:5000/api/v1/plans \
  -H "Authorization: Bearer <admin-token>" -H "Content-Type: application/json" \
  -d '{"name":"Pro","description":"For growing teams","price":499,"billingInterval":"monthly","features":["Unlimited projects"]}'
```

```json
{ "success": true, "data": { "plan": { "_id": "...", "name": "Pro", "price": 499, "billingInterval": "monthly", "isActive": true } } }
```

**Subscribe, then pay (customer):**

```bash
curl -X POST http://localhost:5000/api/v1/subscriptions \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"planId":"<plan-id>"}'
# -> 201, subscription status "pending", plus an unpaid invoice

curl -X POST http://localhost:5000/api/v1/payments \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"subscriptionId":"<subscription-id>","simulate":"success"}'
# -> 201, payment status "succeeded", subscription becomes "active", invoice "paid"
```

To simulate a failure, send `"simulate":"failure"` instead — the subscription
stays `pending` and the invoice becomes `failed` (a new payment can then be
attempted, since the invoice is still not paid).

**Dashboard (admin):**

```json
{
  "success": true,
  "data": {
    "totalCustomers": 12,
    "totalActiveSubscriptions": 8,
    "totalRevenue": 3992,
    "monthlyRevenue": [{ "year": 2026, "month": 11, "revenue": 3992, "payments": 8 }],
    "subscriptionDistribution": [{ "status": "active", "count": 8 }]
  }
}
```

## Testing

```bash
npm test
```

Tests use an in-memory MongoDB (`mongodb-memory-server`), so no local MongoDB
or email credentials are needed. They cover registration and login,
authentication failures, role authorization, plan creation, subscription
creation and duplicate prevention, payment simulation (success, failure,
idempotency, duplicate payment), invoice access control, subscription
cancellation and upgrade, dashboard analytics, and subscription expiry.
Email is not sent during tests because no SMTP credentials are configured.

## Payment simulation — limitations

- This is **not real payment processing**. No money moves, no gateway is
  called, and no card details are collected or stored.
- `simulate: "success"` / `"failure"` exists only so success and failure
  paths can be demonstrated and tested.
- There are no refunds, webhooks, retries by a gateway, or recurring
  auto-charges. A real integration would replace
  `src/controllers/payment.controller.js`'s simulation block with a gateway
  SDK call and webhook verification, keeping the same Payment/Invoice models.
- Invoice amounts are snapshots of the plan price at subscription time; a
  later plan price change does not rewrite existing invoices.
- JWT logout is client-side: the token remains valid until it expires, so
  clients must discard it. A production system would add a token blocklist
  or short-lived access tokens with refresh tokens.

## Security notes

- Passwords are hashed with bcrypt (12 rounds) and never returned in API
  responses (the field is `select: false` and stripped in `toJSON`).
- All request bodies are validated with Zod; unknown/extra role input at
  registration is ignored.
- Customers can only access their own subscriptions, payments, and invoices
  (checked in each controller, not just by route).
- Admin routes require the `admin` role; login and password recovery are
  rate-limited; Helmet headers and a global rate limit are enabled.
- Secrets live only in environment variables.
