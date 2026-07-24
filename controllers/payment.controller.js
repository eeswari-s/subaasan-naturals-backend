import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";
import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import { createRazorpayOrder, verifyPaymentSignature, verifyWebhookSignature } from "../services/payment.service.js";
import { getRazorpayCredentials } from "../services/platformConfig.service.js";
import { deductStock, appendStatusTimeline, markCouponUsed } from "../services/order.service.js";
import { sendOrderConfirmationEmail, sendPaymentSuccessEmail } from "../services/email.service.js";
import { notifyUser, notifyAllAdmins, notifyAllSuperAdmins } from "../services/notification.service.js";
import { getPagination, buildPaginatedResponse } from "../helpers/pagination.helper.js";
import { PAYMENT_STATUS } from "../constants/paymentStatus.js";
import { ORDER_STATUS } from "../constants/orderStatus.js";

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findOne({ _id: orderId, customer: req.user._id });
  if (!order) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");
  }

  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "This order has already been paid for");
  }

  const razorpayOrder = await createRazorpayOrder(order.grandTotal, order.orderNumber);
  const { keyId } = await getRazorpayCredentials();

  let payment = await Payment.findOne({ order: order._id });
  if (!payment) {
    payment = await Payment.create({
      order: order._id,
      customer: req.user._id,
      method: "razorpay",
      amount: order.grandTotal,
      razorpayOrderId: razorpayOrder.id,
    });
    order.payment = payment._id;
    await order.save();
  } else {
    payment.razorpayOrderId = razorpayOrder.id;
    payment.amount = order.grandTotal;
    await payment.save();
  }

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId,
        orderNumber: order.orderNumber,
      },
      "Payment order created"
    )
  );
});

const notifyPaymentSuccess = (order, payment) => {
  notifyAllAdmins({
    title: "Payment Received",
    message: `Payment of Rs. ${payment.amount} received for order ${order.orderNumber}.`,
    type: "payment",
    link: `/orders/${order._id}`,
  }).catch(() => {});
  notifyAllSuperAdmins({
    title: "Payment Received",
    message: `Payment of Rs. ${payment.amount} received for order ${order.orderNumber}.`,
    type: "payment",
    link: `/orders/${order._id}`,
  }).catch(() => {});
};

const notifyPaymentFailure = (order, payment) => {
  notifyAllAdmins({
    title: "Payment Failed",
    message: `Payment of Rs. ${payment.amount} failed for order ${order.orderNumber}.`,
    type: "payment",
    link: `/orders/${order._id}`,
  }).catch(() => {});
  notifyAllSuperAdmins({
    title: "Payment Failed",
    message: `Payment of Rs. ${payment.amount} failed for order ${order.orderNumber}.`,
    type: "payment",
    link: `/orders/${order._id}`,
  }).catch(() => {});
};

export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const order = await Order.findOne({ _id: orderId, customer: req.user._id });
  if (!order) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");
  }

  const payment = await Payment.findOne({ order: order._id, razorpayOrderId: razorpay_order_id });
  if (!payment) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Payment record not found for this order");
  }

  const isValid = await verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });

  if (!isValid) {
    payment.status = PAYMENT_STATUS.FAILED;
    payment.failureReason = "Signature verification failed";
    await payment.save();
    notifyPaymentFailure(order, payment);
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Payment verification failed");
  }

  if (payment.status !== PAYMENT_STATUS.PAID) {
    payment.status = PAYMENT_STATUS.PAID;
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    order.paymentStatus = PAYMENT_STATUS.PAID;
    await appendStatusTimeline(order, ORDER_STATUS.CONFIRMED, "Payment received via Razorpay");

    await deductStock(order.items);
    if (order.coupon) await markCouponUsed(order.coupon, order.customer);

    const user = await User.findById(order.customer);
    sendOrderConfirmationEmail(user.email, user.name, order).catch(() => {});
    sendPaymentSuccessEmail(user.email, user.name, order, payment).catch(() => {});
    notifyUser(user._id, {
      title: "Payment Successful",
      message: `Your payment for order ${order.orderNumber} was successful.`,
      type: "payment",
      link: `/orders/${order._id}`,
    }).catch(() => {});
    notifyPaymentSuccess(order, payment);
  }

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { order, payment }, "Payment verified successfully"));
});

export const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.body;

  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid webhook signature");
  }

  const payload = JSON.parse(rawBody.toString());
  const eventId = `${payload.event}:${payload.payload?.payment?.entity?.id || payload.payload?.order?.entity?.id}`;

  const razorpayOrderId =
    payload.payload?.payment?.entity?.order_id || payload.payload?.order?.entity?.id;

  if (!razorpayOrderId) {
    return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Event ignored"));
  }

  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) {
    return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "No matching payment found"));
  }

  if (payment.processedWebhookEvents.includes(eventId)) {
    return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Event already processed"));
  }

  const order = await Order.findById(payment.order);

  if (payload.event === "payment.captured" || payload.event === "order.paid") {
    if (payment.status !== PAYMENT_STATUS.PAID) {
      payment.status = PAYMENT_STATUS.PAID;
      payment.razorpayPaymentId = payload.payload?.payment?.entity?.id || payment.razorpayPaymentId;
      await payment.save();

      if (order && order.paymentStatus !== PAYMENT_STATUS.PAID) {
        order.paymentStatus = PAYMENT_STATUS.PAID;
        await appendStatusTimeline(order, ORDER_STATUS.CONFIRMED, "Payment captured via Razorpay webhook");
        await deductStock(order.items);
        if (order.coupon) await markCouponUsed(order.coupon, order.customer);
      }
      if (order) notifyPaymentSuccess(order, payment);
    }
  } else if (payload.event === "payment.failed") {
    payment.status = PAYMENT_STATUS.FAILED;
    payment.failureReason = payload.payload?.payment?.entity?.error_description || "Payment failed";
    await payment.save();

    if (order && order.paymentStatus !== PAYMENT_STATUS.PAID) {
      order.paymentStatus = PAYMENT_STATUS.FAILED;
      await order.save();
    }
    if (order) notifyPaymentFailure(order, payment);
  }

  payment.processedWebhookEvents.push(eventId);
  await payment.save();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Webhook processed"));
});

export const getMyTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = { customer: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [docs, total] = await Promise.all([
    Payment.find(filter).populate("order", "orderNumber grandTotal orderStatus").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Transactions fetched"));
});
