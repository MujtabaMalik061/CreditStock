# CreditStock

CreditStock is a React + Express + MongoDB shop dashboard for inventory, sales, and customer credit.

## What it does

- Products: catalog, prices, SKU checks, stock movements, reorder alerts, search, filters, and CSV export
- Sales: record a product sale, deduct stock, collect full or partial payment, and print a receipt
- Credit: customer profiles, calculated balances, payment history, partial payments, and user-triggered WhatsApp reminders
- Reports: seven-day sales trend, outstanding credit, stock value, low-stock alerts, and estimated sales profit
- Records: latest 100 transactions with type filters and CSV export

## Project structure

- Frontend/src/pages: Overview, Inventory, Customers, Activity, Reports
- Frontend/src/components: transaction forms, icons, sales chart
- Frontend/src/api: HTTP client
- Backend/src/models: products, customers, transactions
- Backend/src/routes: products, customers, transactions, dashboard
- Backend/src/services: credit balance calculation

## Run locally

Set Backend/.env.development.local:

    DB_URI=mongodb://127.0.0.1:27017/creditstock
    PORT=5000
    NODE_ENV=development

Use your own MongoDB connection if it is hosted elsewhere. Install dependencies in the root, Backend, and Frontend if needed, then start both apps from the root:

    npm run local

Open http://localhost:5173 for the landing page, or http://localhost:5173/app for the shop workspace. The landing page is available without a database connection; the workspace requires the backend. Vite proxies /api to the PORT configured in Backend/.env.development.local (falling back to 5000). For deployment, set VITE_API_URL for the frontend and CLIENT_ORIGIN for the backend.

The backend connects to MongoDB before listening. An unreachable database prevents the API from starting.

## Scope

This is a shop-management portfolio prototype with separate account workspaces. The profit figure is an estimate based on product cost at sale for new transactions; older transactions use current product cost where available. Receipts cover one product per sale. Email/password authentication and per-account data isolation are included. Database transactions should still be added for atomic stock/payment operations under concurrent writes.


## Accounts

- `/signup`: name, shop name, email, password, and password confirmation. Successful registration signs in automatically.
- `/signin`: email/password login; signed-in visitors go to `/app`.
- `/app`: protected workspace, account details, and sign-out.
- API: `POST /api/auth/signup`, `POST /api/auth/signin`, `POST /api/auth/signout`, `GET /api/auth/me`.

Passwords are bcrypt-hashed. Seven-day sessions use random opaque tokens in HTTP-only, SameSite=Lax cookies, with only token hashes stored in MongoDB. Logout revokes the current session. Production cookies require HTTPS. No JWT secret is needed. Login/registration failures are rate limited. Customer, product, transaction, and report queries are scoped to the authenticated account.

Set `CLIENT_ORIGIN` to the exact frontend origin (or comma-separated allowed origins). For production, serve `/api` through the frontend origin or use an API on the same site, such as `app.example.com` and `api.example.com`. Unrelated frontend/API domains are intentionally unsupported by the SameSite cookie policy. If using a separate same-site API, set `VITE_API_URL` to its `/api` URL. Development uses the Vite `/api` proxy, which reads `PORT` from `Backend/.env.development.local` (default 5000). Set `API_PROXY_TARGET` in the frontend environment or shell to override the backend address. Restart Vite after changing the backend port.

Legacy records without an owner remain in the database but are not exposed to new accounts. Assign their `owner` fields to the intended existing user only after verifying ownership; do not automatically give historical records to the first signup. On startup the old global SKU index is replaced with uniqueness per account, without deleting records.

## Authentication tests

Start a disposable local MongoDB instance, then run:

    TEST_DB_URI=mongodb://127.0.0.1:27019 npm test --prefix Backend

Tests use a unique temporary database and delete only that database afterward. They never use the application’s `DB_URI`. Coverage includes registration, password hashing, cookies, login, logout/session revocation, expiration, request-origin validation, rate limiting, and cross-account access attempts.
