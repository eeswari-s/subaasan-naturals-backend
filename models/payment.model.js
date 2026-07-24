import mongoose from "mongoose";
import { PAYMENT_METHOD_VALUES, PAYMENT_STATUS_VALUES, PAYMENT_STATUS } from "../constants/paymentStatus.js";

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    method: { type: String, enum: PAYMENT_METHOD_VALUES, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: PAYMENT_STATUS_VALUES, default: PAYMENT_STATUS.PENDING },

    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },

    failureReason: { type: String, default: "" },
    processedWebhookEvents: [{ type: String }],
  },
  { timestamps: true }
);

paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
