import mongoose from "mongoose";
import { ORDER_STATUS, ORDER_STATUS_VALUES, RETURN_STATUS, RETURN_STATUS_VALUES, REFUND_STATUS, REFUND_STATUS_VALUES } from "../constants/orderStatus.js";
import { PAYMENT_METHOD_VALUES, PAYMENT_STATUS, PAYMENT_STATUS_VALUES } from "../constants/paymentStatus.js";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantName: { type: String, default: null },
    productNameSnapshot: { type: String, required: true },
    priceSnapshot: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    landmark: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
  },
  { _id: false }
);

const statusTimelineSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUS_VALUES, required: true },
    note: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    address: addressSnapshotSchema,

    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    paymentMethod: { type: String, enum: PAYMENT_METHOD_VALUES, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUS_VALUES, default: PAYMENT_STATUS.PENDING },

    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    orderStatus: { type: String, enum: ORDER_STATUS_VALUES, default: ORDER_STATUS.PENDING },
    statusTimeline: [statusTimelineSchema],

    tracking: {
      carrier: { type: String, default: "" },
      trackingNumber: { type: String, default: "" },
      trackingUrl: { type: String, default: "" },
    },

    invoiceNumber: { type: String, default: null },

    returnRequest: {
      reason: { type: String, default: "" },
      images: [{ url: String, publicId: String }],
      status: { type: String, enum: RETURN_STATUS_VALUES, default: RETURN_STATUS.NONE },
      requestedAt: { type: Date, default: null },
    },

    refund: {
      amount: { type: Number, default: 0 },
      status: { type: String, enum: REFUND_STATUS_VALUES, default: REFUND_STATUS.NONE },
      processedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
