export const PAYMENT_METHOD = Object.freeze({
  RAZORPAY: "razorpay",
  COD: "COD",
});

export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD);

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
});

export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);
