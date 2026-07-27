import dotenv from "dotenv";
dotenv.config();

// CLIENT_URL may be a single URL or a comma-separated list (e.g. local dev port +
// deployed frontend). CLIENT_URLS is the full allow-list (used for CORS). CLIENT_URL
// is a single canonical URL for building real links in emails/WhatsApp shares — prefer
// the first non-localhost https:// entry so those links never point at a dev machine,
// falling back to the first entry only if nothing else is configured.
const clientUrls = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const isLocalUrl = (url) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url);
const canonicalClientUrl = clientUrls.find((url) => !isLocalUrl(url)) || clientUrls[0];

export default {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  CLIENT_URL: canonicalClientUrl,
  CLIENT_URLS: clientUrls,

  MONGODB_URI: process.env.MONGODB_URI,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
  // Admin panel convenience: admins stay logged in for a week instead of needing a
  // silent-refresh flow on the frontend. Customer/Super Admin keep the short-lived default.
  ADMIN_JWT_ACCESS_EXPIRY: process.env.ADMIN_JWT_ACCESS_EXPIRY || "7d",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,

  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME || "Subaasan Naturals",

  COOKIE_SECRET: process.env.COOKIE_SECRET,
  CONFIG_ENCRYPTION_KEY: process.env.CONFIG_ENCRYPTION_KEY || process.env.COOKIE_SECRET || "dev-only-insecure-fallback-key",
  CONFIG_ENCRYPTION_KEY_IS_EXPLICIT: Boolean(process.env.CONFIG_ENCRYPTION_KEY),
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
  SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME || "Super Admin",

  TAX_PERCENTAGE: Number(process.env.TAX_PERCENTAGE || 5),
  FREE_SHIPPING_THRESHOLD: Number(process.env.FREE_SHIPPING_THRESHOLD || 999),
  DEFAULT_SHIPPING_CHARGE: Number(process.env.DEFAULT_SHIPPING_CHARGE || 49),
};
