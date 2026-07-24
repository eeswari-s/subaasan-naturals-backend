import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import env from "../config/env.js";

export const createRazorpayOrder = async (amount, receipt) => {
  const options = {
    amount: Math.round(amount * 100), // Razorpay expects paise
    currency: "INR",
    receipt,
  };
  return razorpay.orders.create(options);
};

export const verifyPaymentSignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const generatedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  return generatedSignature === razorpay_signature;
};

export const verifyWebhookSignature = (rawBody, signature) => {
  if (!signature) return false;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return expectedSignature === signature;
};
