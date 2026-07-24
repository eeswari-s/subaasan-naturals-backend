import env from "../config/env.js";

/**
 * Pure calculation function used by both checkout preview and final order
 * creation so the two can never drift apart.
 *
 * @param {Array<{ price: number, quantity: number, freeShipping?: boolean }>} items
 * @param {{ type: 'flat'|'percentage', value: number, maxDiscount?: number } | null} coupon
 * @param {{ taxPercentage?: number, shippingCharge?: number, freeShippingThreshold?: number }} options
 */
const calculateOrderTotals = (items = [], coupon = null, options = {}) => {
  const taxPercentage = options.taxPercentage ?? env.TAX_PERCENTAGE;
  const baseShippingCharge = options.shippingCharge ?? env.DEFAULT_SHIPPING_CHARGE;
  const freeShippingThreshold = options.freeShippingThreshold ?? env.FREE_SHIPPING_THRESHOLD;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discount = 0;
  if (coupon) {
    if (coupon.type === "flat") {
      discount = coupon.value;
    } else if (coupon.type === "percentage") {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    }
    discount = Math.min(discount, subtotal);
  }

  const taxableAmount = Math.max(subtotal - discount, 0);
  const tax = Number(((taxableAmount * taxPercentage) / 100).toFixed(2));

  const hasFreeShippingItem = items.some((item) => item.freeShipping);
  let shippingCharge = baseShippingCharge;
  if (hasFreeShippingItem || subtotal - discount >= freeShippingThreshold) {
    shippingCharge = 0;
  }

  const grandTotal = Number((taxableAmount + tax + shippingCharge).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    tax,
    shippingCharge: Number(shippingCharge.toFixed(2)),
    grandTotal,
  };
};

export default calculateOrderTotals;
