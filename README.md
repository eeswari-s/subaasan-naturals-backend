# Subaasan Naturals — Backend

Production backend for the Subaasan Naturals single-vendor e-commerce platform. Node.js + Express + MongoDB (Mongoose), with Razorpay payments, Cloudinary image storage, and Brevo transactional email.

## Tech Stack

- Node.js (ES Modules, async/await only) + Express.js
- MongoDB Atlas + Mongoose
- JWT access/refresh authentication (separate stacks for Customer, Admin, Super Admin)
- Razorpay (Orders API, payment verification, webhooks) + Cash on Delivery
- Cloudinary (via Multer memory storage → sharp compression → Cloudinary upload)
- Brevo transactional email API
- express-validator, Helmet, CORS, express-rate-limit, mongo-sanitize, xss filtering
- pdfkit for invoice generation

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in every value:
   ```
   cp .env.example .env
   ```
3. Start MongoDB Atlas and make sure `MONGODB_URI` points to it.
4. Seed the initial Super Admin account (reads `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` from `.env`):
   ```
   npm run seed
   ```
5. Run the dev server:
   ```
   npm run dev
   ```
6. Confirm it's alive:
   ```
   GET http://localhost:5000/health
   ```

## Environment Variables

See `.env.example` for the full list. Every variable there is read exclusively through `config/env.js` — no other file touches `process.env` directly.

| Variable | Purpose |
|---|---|
| `NODE_ENV`, `PORT`, `CLIENT_URL` | Runtime + CORS origin |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` / `JWT_ACCESS_EXPIRY` | Access token signing (short-lived) |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRY` | Refresh token signing (long-lived, httpOnly cookie) |
| `CLOUDINARY_*` | Image storage |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Payments |
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | Transactional email |
| `COOKIE_SECRET` | Cookie signing |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` / `SUPER_ADMIN_NAME` | Used only by `npm run seed` |
| `TAX_PERCENTAGE` / `FREE_SHIPPING_THRESHOLD` / `DEFAULT_SHIPPING_CHARGE` | Order total calculation defaults |

## Project Structure

```
config/        env, db, cloudinary, razorpay, brevo setup
constants/     roles, order/payment status enums, http status codes
models/        Mongoose schemas
controllers/   thin request handlers (auth/, customer/, admin/, superAdmin/, top-level shared)
routes/        Express routers, mirrors controllers/
middlewares/   auth, admin, superAdmin, upload, error, rate limiting, validation
services/      business logic (email, payment, order, product, invoice, notification)
helpers/       pagination, filtering, slug generation
validators/    express-validator chains per route group
utils/         ApiError, ApiResponse, asyncHandler, token/otp helpers, cloudinary upload, invoice PDF, order totals
emails/templates/  HTML email templates (inline CSS, no template engine dependency)
scripts/       seedSuperAdmin.js
```

## Architecture

Strict MVC + service layer: routers wire `validator → auth middleware → controller`; controllers stay thin and call into `services/` for real business logic (price calculation, stock deduction, coupon validation, order transitions); models hold schema-level concerns only (hashing, comparePassword).

## Auth Model

Three completely separate auth stacks — Customer (`/api/v1/auth/customer`), Admin (`/api/v1/auth/admin`), Super Admin (`/api/v1/auth/super-admin`) — each with its own Mongoose model, its own httpOnly refresh-token cookie name, and its own authorization middleware. All three share the same token-signing utilities (`utils/generateTokens.js`) and the same `RefreshToken` collection (hashed tokens, revocable, TTL-indexed).

Admin and Super Admin accounts are not self-registrable — create the first Super Admin via `npm run seed`, then have that Super Admin (or an existing Admin, through whatever internal tooling you build on top of this API) provision further accounts directly in MongoDB or via a future admin-management endpoint.

## Payments

- `POST /api/v1/payments/create-order` — creates a Razorpay order for an existing internal `Order` document, amount always recalculated server-side.
- `POST /api/v1/payments/verify` — verifies the Razorpay signature, marks payment/order paid, deducts stock, sends confirmation + payment success emails, creates a notification.
- `POST /api/v1/payments/webhook` — raw-body signature-verified webhook handling `payment.captured`, `payment.failed`, `order.paid` idempotently (mounted before the global JSON parser in `index.js`).
- Cash on Delivery is a first-class alternate path through `POST /api/v1/checkout`.

## Image Uploads

Every image field (products, variants, banners, reviews, categories, blog, store logo/favicon, profile avatars) goes through the same pipeline: Multer memory storage → `utils/imageCompress.js` (sharp resize/compress to webp) → `utils/cloudinaryUpload.js` (`upload_stream` to a per-entity Cloudinary folder) → only `{ url, publicId }` is stored in MongoDB. Replacing or deleting an entity deletes the old Cloudinary asset by `publicId`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start with nodemon |
| `npm start` | Start in production mode |
| `npm run seed` | Create the initial Super Admin account |
