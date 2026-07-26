import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";
import ApiError from "../utils/ApiError.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";
import { incrementSoldCount } from "./product.service.js";

export const validateAndCalculateCoupon = async (code, userId, subtotal) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), status: "active" });

  if (!coupon) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Invalid coupon code");
  }

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "This coupon is not valid at this time");
  }

  if (subtotal < coupon.minOrderValue) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Minimum order value of Rs. ${coupon.minOrderValue} is required for this coupon`);
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "This coupon has reached its usage limit");
  }

  const userUsage = coupon.usedBy.find((entry) => entry.user.toString() === userId.toString());
  if (userUsage && userUsage.count >= coupon.usageLimitPerUser) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "You have already used this coupon the maximum number of times");
  }

  return coupon;
};

export const markCouponUsed = async (couponId, userId) => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) return;

  const userUsage = coupon.usedBy.find((entry) => entry.user.toString() === userId.toString());
  if (userUsage) {
    userUsage.count += 1;
  } else {
    coupon.usedBy.push({ user: userId, count: 1 });
  }
  coupon.usedCount += 1;
  await coupon.save();
};

export const validateStockAvailability = async (items) => {
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || product.status !== "active") {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Product is no longer available`);
    }

    let availableStock = product.stock;
    if (item.variantName) {
      const variant = product.variants.find((v) => v.variantName === item.variantName);
      if (!variant) throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Variant "${item.variantName}" not found for ${product.name}`);
      availableStock = variant.stock;
    }

    if (availableStock < item.quantity) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Insufficient stock for ${product.name}${item.variantName ? " (" + item.variantName + ")" : ""}`);
    }
  }
};

export const deductStock = async (items) => {
  for (const item of items) {
    if (item.variantName) {
      await Product.updateOne(
        { _id: item.product, "variants.variantName": item.variantName },
        { $inc: { "variants.$.stock": -item.quantity, stock: -item.quantity } }
      );
    } else {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } });
    }
    await incrementSoldCount(item.product, item.quantity);
  }
};

export const restoreStock = async (items) => {
  for (const item of items) {
    if (item.variantName) {
      await Product.updateOne(
        { _id: item.product, "variants.variantName": item.variantName },
        { $inc: { "variants.$.stock": item.quantity, stock: item.quantity } }
      );
    } else {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    }
    await incrementSoldCount(item.product, -item.quantity);
  }
};

// Order items are a mix of plain product lines and combo lines (combo set,
// comboItems snapshotting what was inside at purchase time). Stock functions only
// understand flat {product, variantName, quantity} lines, so expand combo lines
// (comboItems' per-combo-unit quantity × how many combo units were ordered) here —
// this is the single place every stock-affecting flow (payment success, webhook,
// cancellation, return) should go through for an already-created order.
export const flattenOrderItemsForStock = (items) => {
  const flat = [];
  items.forEach((item) => {
    if (item.combo && item.comboItems?.length) {
      item.comboItems.forEach((comboItem) => {
        flat.push({
          product: comboItem.product,
          variantName: comboItem.variantName,
          quantity: comboItem.quantity * item.quantity,
        });
      });
    } else if (item.product) {
      flat.push({ product: item.product, variantName: item.variantName, quantity: item.quantity });
    }
  });
  return flat;
};

export const appendStatusTimeline = async (order, status, note = "") => {
  order.orderStatus = status;
  order.statusTimeline.push({ status, note, timestamp: new Date() });
  await order.save();
  return order;
};
