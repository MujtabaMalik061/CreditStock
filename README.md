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

Open http://localhost:5173. Vite proxies /api to the backend on port 5000. For deployment, set VITE_API_URL for the frontend and CLIENT_ORIGIN for the backend.

The backend connects to MongoDB before listening. An unreachable database prevents the API from starting.

## Scope

This is a single-shop portfolio prototype. The profit figure is an estimate based on product cost at sale for new transactions; older transactions use current product cost where available. Receipts cover one product per sale. Authentication and database transactions should be added before storing real business data or allowing multiple users.
