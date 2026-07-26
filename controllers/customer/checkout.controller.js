import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Cart from "../../models/cart.model.js";
import Address from "../../models/address.model.js";
import Order from "../../models/order.model.js";
import Combo from "../../models/combo.model.js";
import { buildCartResponse } from "./cart.controller.js";
import { validateStockAvailability, deductStock, appendStatusTimeline, markCouponUsed } from "../../services/order.service.js";
import { flattenComboItems, buildComboItemsSnapshot, validateComboStock } from "../../services/combo.service.js";
import generateOrderNumber from "../../utils/generateOrderNumber.js";
import { sendOrderConfirmationEmail } from "../../services/email.service.js";
import { notifyUser } from "../../services/notification.service.js";
import { PAYMENT_METHOD, PAYMENT_STATUS } from "../../constants/paymentStatus.js";
import { ORDER_STATUS } from "../../constants/orderStatus.js";

const COMBO_POPULATE_FIELDS = "name slug thumbnail status variants offerPrice sellingPrice stock";

export const previewCheckout = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  const response = await buildCartResponse(cart);

  if (response.items.length === 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Your cart is empty");
  }

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, response, "Checkout preview"));
});

export const createOrder = asyncHandler(async (req, res) => {
  const { addressId, paymentMethod } = req.body;

  const address = await Address.findOne({ _id: addressId, user: req.user._id });
  if (!address) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Address not found");

  const cart = await Cart.findOne({ user: req.user._id });
  const cartData = await buildCartResponse(cart);

  if (cartData.items.length === 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Your cart is empty");
  }

  const comboIds = cartData.items.filter((i) => i.isCombo).map((i) => i.combo._id);
  const combos = await Combo.find({ _id: { $in: comboIds } }).populate("items.product", COMBO_POPULATE_FIELDS);
  const comboMap = new Map(combos.map((c) => [c._id.toString(), c]));

  // Flatten combo lines into their constituent products (× combo quantity) so stock
  // validation/deduction/restore can reuse the exact same product-level logic as
  // regular items, instead of needing a combo-aware branch inside order.service.js.
  const stockCheckItems = [];
  cartData.items.forEach((i) => {
    if (i.isCombo) {
      const combo = comboMap.get(i.combo._id.toString());
      if (!combo) throw new ApiError(HTTP_STATUS.BAD_REQUEST, `"${i.combo.name}" is no longer available`);
      validateComboStock(combo, i.quantity);
      stockCheckItems.push(...flattenComboItems(combo.items, i.quantity));
    } else {
      stockCheckItems.push({ product: i.product._id, variantName: i.variantName, quantity: i.quantity });
    }
  });
  await validateStockAvailability(stockCheckItems);

  const orderItems = cartData.items.map((i) => {
    if (i.isCombo) {
      const combo = comboMap.get(i.combo._id.toString());
      return {
        combo: combo._id,
        comboItems: buildComboItemsSnapshot(combo),
        productNameSnapshot: combo.name,
        priceSnapshot: i.price,
        quantity: i.quantity,
        image: i.image || combo.thumbnail?.url || "",
      };
    }
    return {
      product: i.product._id,
      variantName: i.variantName,
      productNameSnapshot: i.product.name,
      priceSnapshot: i.price,
      quantity: i.quantity,
      image: i.image || i.product.thumbnail?.url || "",
    };
  });

  const addressSnapshot = {
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    landmark: address.landmark,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country,
  };

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer: req.user._id,
    items: orderItems,
    address: addressSnapshot,
    paymentMethod,
    paymentStatus: PAYMENT_STATUS.PENDING,
    coupon: cart.coupon || null,
    subtotal: cartData.subtotal,
    discount: cartData.discount,
    tax: cartData.tax,
    shippingCharge: cartData.shippingCharge,
    grandTotal: cartData.grandTotal,
    orderStatus: ORDER_STATUS.PENDING,
    statusTimeline: [{ status: ORDER_STATUS.PENDING, note: "Order placed", timestamp: new Date() }],
  });

  if (paymentMethod === PAYMENT_METHOD.COD) {
    await deductStock(stockCheckItems);
    if (order.coupon) await markCouponUsed(order.coupon, req.user._id);
    await appendStatusTimeline(order, ORDER_STATUS.CONFIRMED, "Order confirmed (Cash on Delivery)");

    sendOrderConfirmationEmail(req.user.email, req.user.name, order).catch(() => {});
    notifyUser(req.user._id, {
      title: "Order Placed",
      message: `Your order ${order.orderNumber} has been placed successfully.`,
      type: "order",
      link: `/orders/${order._id}`,
    }).catch(() => {});
  }

  cart.items = [];
  cart.coupon = null;
  await cart.save();

  return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, order, "Order created"));
});
