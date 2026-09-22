# Server API

A Node.js REST API built with **Express**, **MongoDB (Mongoose)**, and **Zod** for schema validation.  
It includes authentication (local + Google + Apple), OTP verification, file uploads with Multer, rate limiting, and email notifications with Nodemailer.

---

## Deployed frontend

In the backend Vercel project's Production environment, set
`CLIENT_ORIGIN=https://credit-stock.vercel.app` and `NODE_ENV=production`,
then redeploy the backend. `CLIENT_ORIGIN` overrides the default allowlist;
multiple origins can be comma-separated. Use exact frontend origins, not API URLs.

In the frontend Vercel project's Production environment, set
`VITE_API_URL=https://credit-stock-backend.vercel.app/api` and redeploy after
changing it. Keep `Frontend/.env` pointed at localhost for local development.

Production session cookies use `SameSite=None; Secure` for the separate frontend
and API sites. Browsers that block third-party cookies may require hosting the
API under the same site as the frontend.

Run the database-independent CORS checks with `npm run test:cors`.
