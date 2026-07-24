import Razorpay from "razorpay";
import env from "./env.js";

// Boot-time default instance, built from .env. Real request-time usage goes through
// services/payment.service.js, which builds a fresh instance per call using
// services/platformConfig.service.js (DB override with this env config as fallback) —
// so a Super Admin key change takes effect immediately without a restart.
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayInstance = (keyId, keySecret) => new Razorpay({ key_id: keyId, key_secret: keySecret });

export default razorpay;
