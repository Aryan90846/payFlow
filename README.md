# PayFlow Frontend

React + Vite frontend for the PayFlow Subscription & Billing Management System.
It talks only to the existing PayFlow backend — there is no fake data, no fake
authentication, and no real payment gateway.

## Tech stack

React, Vite, React Router DOM, Axios, Tailwind CSS, Lucide React icons,
Recharts, React Hot Toast. JavaScript (ES6+).

## Run it

Backend first (from the project root):

```bash
npm install
npm run dev        # backend on http://localhost:5000
```

Then the frontend:

```bash
cd frontend
npm install
npm run dev        # frontend on http://localhost:5173
```

Copy `.env.example` to `.env` if you need a different backend URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Pages

| Route | Who | What |
| --- | --- | --- |
| `/` | Public | Landing: hero, features, live pricing preview, how it works, footer |
| `/login`, `/register` | Public | JWT login / registration (new accounts are always customers) |
| `/forgot-password`, `/reset-password` | Public | Reset-token flow using the backend's token (paste it from the email) |
| `/dashboard` | Customer | Current subscription, renewal date, payment count, recent transactions |
| `/plans` | Public | Active plans from the backend, interval filter, subscribe |
| `/subscriptions` | Customer | Current subscription, history, upgrade/downgrade, cancel (with confirmation) |
| `/checkout?planId=…` | Customer | Simulated checkout: method selector, success/failure simulation, result screen |
| `/payments` | Customer | Simulated payment history with transaction references |
| `/invoices` | Customer | Invoice list and details; print via the browser (the backend generates no PDF) |
| `/settings` | Customer | Profile name update, account info, logout |
| `/admin` | Admin | Totals, subscription distribution, recent transactions, expiry check |
| `/admin/users` | Admin | Search, role filter, pagination, role changes |
| `/admin/plans` | Admin | Create, edit, delete, activate/deactivate plans |
| `/admin/analytics` | Admin | Monthly revenue bar chart and subscription distribution pie chart (Recharts) |

Admin routes are guarded by role: a customer visiting `/admin` is redirected
to `/dashboard`.

## How the integration works

- One Axios instance (`src/api/axios.js`) reads `VITE_API_BASE_URL`, attaches
  the JWT from `localStorage` (`payflow_token`), and redirects to `/login`
  when a stored token is rejected with 401.
- `src/context/AuthContext.jsx` loads the current user from `GET /auth/me`
  on startup and stores the token returned by login/register.
- Every API call goes through a small module in `src/api/` that mirrors one
  backend resource. Responses follow the backend shape:
  `{ success, data, pagination? }`, and errors surface the backend's
  `message` (plus Zod `details` when present) via toast or an error state.
- There is **no refresh-token flow** — the backend issues a single JWT
  (`JWT_EXPIRES_IN`, default 1 day) and logout simply clears it from the
  browser. The backend token itself remains valid until expiry.

## Checkout, honestly

Payments are simulated. Checkout never asks for a card number, expiry, or
CVV, and nothing like that is stored. The flow is:

1. Pick a plan → checkout loads it (or reuses a pending subscription).
2. Choose a method (`card`, `upi`, `netbanking`) and a simulated outcome.
3. The frontend creates a subscription if needed, then calls
   `POST /payments` with `{ subscriptionId, paymentMethod, simulate, idempotencyKey }`.
4. Success activates the subscription and marks its invoice paid; failure
   leaves it pending so it can be retried.

If you already have an active subscription, checkout tells you so and points
you at upgrade/downgrade instead of creating a duplicate (the backend also
rejects duplicates with 409).

## Backend limitations the frontend respects

- **No PDF invoices.** The backend stores invoice data but generates no PDF,
  so the frontend offers browser printing from the invoice detail view
  instead of a fake download.
- **No total-users field on the dashboard endpoint.** It returns
  `totalCustomers` (customer role only). The admin dashboard therefore gets
  total users from the users list pagination total, and labels each number
  for what it actually is.
- **No per-customer revenue total.** The customer dashboard shows payment
  count and recent transactions, not an invented lifetime-spend figure.
- **No refunds, webhooks, or recurring auto-charges** in the backend, so none
  are shown in the UI.
- **Password reset needs the token from email.** The backend sends it by
  email (or logs it to the backend console in development when SMTP is not
  configured). The reset page therefore has an explicit token field.
- **Admin accounts are not self-service.** Registration always creates a
  customer; an existing admin promotes users from Admin → Users, or the
  backend seeds one from `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

## Routing fixes (2026-11-02)

The core React Router setup was correct (BrowserRouter, nested layouts,
protected/admin guards, all links as `Link`/`NavLink`, no `href="#"`),
but three real navigation weaknesses were found and fixed:

- **Header "Pricing" was an anchor** (`/#pricing`) that kept users on the
  landing page. It is now a real link to `/plans`. "Features" and "How
  it works" are now Router links to `/#features` / `/#how-it-works`,
  and a new `ScrollManager` scrolls to those sections — previously
  React Router did not scroll to hash targets at all, so those clicks
  also looked like nothing happened.
- **Protected redirects lost the destination.** Clicking a protected
  page while logged out sent you to `/login`, then always to the
  dashboard after login. `ProtectedRoute`/`AdminRoute` now remember
  the intended page, and Login/Register return you to it (except
  admin-only pages for customers, which go to the dashboard).
- **Unknown URLs silently showed the landing page.** The catch-all
  route redirected everything to `/`. It now renders a 404 page
  (`pages/NotFound.jsx`) with links to home, dashboard, and plans.
- **"Network Error" on the pricing preview** was Axios's bare message
  when the backend is not reachable (backend not running, or wrong
  port). `getErrorMessage` now says plainly: "Could not reach the
  backend at http://localhost:5000. Please start the backend
  (npm run dev) and reload the page." CORS and the base URL were
  verified correct (see the delivery report), so a Network Error means
  the backend is not running — not a CORS or configuration problem.

## Known limitation: the assistant's browser sandbox

In the assistant's sandboxed browser environment, `lvh.me` does **not**
resolve to `127.0.0.1` — it resolves to the sandbox egress proxy
(`198.18.24.246`), so `http://lvh.me:5000` returns
`ERR_CONNECTION_REFUSED` even while the backend is healthy on
`http://localhost:5000`. The frontend code itself is correct: its served
Axios module shows `VITE_API_BASE_URL=http://localhost:5000/api/v1`, and
the backend answers that URL with CORS `Access-Control-Allow-Origin: *`.
This is a limitation of that browser test environment only, not of the
app. On your own machine (including Windows, below), open
`http://localhost:5173` and the frontend reaches
`http://localhost:5000` directly.

## Project structure

```
src/
  api/          axios instance + one module per backend resource
  components/   common (cards, badges, dialogs, pagination, skeletons),
                layout (logo, sidebar), forms (auth card, password field)
  context/      AuthContext.jsx
  layouts/      PublicLayout, DashboardLayout, AdminLayout
  pages/        public, customer, and admin/ pages
  routes/       AppRoutes, ProtectedRoute, AdminRoute
  utils/        format.js (currency, dates, API error messages)
```
