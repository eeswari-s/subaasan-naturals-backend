export const ORDER_STATUS = Object.freeze({
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out For Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
});

export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);

export const RETURN_STATUS = Object.freeze({
  NONE: "none",
  REQUESTED: "requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  PROCESSED: "processed",
});

export const RETURN_STATUS_VALUES = Object.values(RETURN_STATUS);

export const REFUND_STATUS = Object.freeze({
  NONE: "none",
  PENDING: "pending",
  PROCESSED: "processed",
  FAILED: "failed",
});

export const REFUND_STATUS_VALUES = Object.values(REFUND_STATUS);
