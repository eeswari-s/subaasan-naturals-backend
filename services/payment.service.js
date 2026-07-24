import crypto from "crypto";
import env from "../config/env.js";
import { createRazorpayInstance } from "../config/razorpay.js";
import { getRazorpayCredentials } from "./platformConfig.service.js";

export const createRazorpayOrder = async (amount, receipt) => {
  const { keyId, keySecret } = await getRazorpayCredentials();
  const razorpay = createRazorpayInstance(keyId, keySecret);

  const options = {
    amount: Math.round(amount * 100), // Razorpay expects paise
    currency: "INR",
    receipt,
  };
  return razorpay.orders.create(options);
};

export const verifyPaymentSignature = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const { keySecret } = await getRazorpayCredentials();
  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
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
