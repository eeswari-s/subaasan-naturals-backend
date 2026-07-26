import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Order from "../../models/order.model.js";
import Payment from "../../models/payment.model.js";
import User from "../../models/user.model.js";
import { getPagination, buildPaginatedResponse } from "../../helpers/pagination.helper.js";
import { buildDateRangeFilter } from "../../helpers/filter.helper.js";
import { appendStatusTimeline, restoreStock, flattenOrderItemsForStock } from "../../services/order.service.js";
import { ensureInvoiceNumber, getInvoiceBuffer } from "../../services/invoice.service.js";
import { notifyUser } from "../../services/notification.service.js";
import { ORDER_STATUS, RETURN_STATUS, REFUND_STATUS } from "../../constants/orderStatus.js";
import { PAYMENT_STATUS } from "../../constants/paymentStatus.js";

export const getAdminOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = { ...buildDateRangeFilter(req.query) };
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.search) filter.orderNumber = { $regex: req.query.search, $options: "i" };
  if (req.query.customer) filter.customer = req.query.customer;

  const [docs, total] = await Promise.all([
    Order.find(filter).populate("customer", "name email phone").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Orders fetched"));
});

export const getAdminOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("customer", "name email phone").populate("coupon", "code type value");
  if (!order) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, order, "Order fetched"));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");

  if ([ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(order.orderStatus)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Order is already ${order.orderStatus} and cannot be updated further`);
  }

  if (status === ORDER_STATUS.CANCELLED) {
    await restoreStock(flattenOrderItemsForStock(order.items));
  }

  if (status === ORDER_STATUS.DELIVERED && order.paymentMethod === "COD" && order.paymentStatus !== PAYMENT_STATUS.PAID) {
    order.paymentStatus = PAYMENT_STATUS.PAID;
  }

  await appendStatusTimeline(order, status, note);

  const user = await User.findById(order.customer);
  if (user) {
    notifyUser(user._id, {
      title: "Order Status Updated",
      message: `Your order ${order.orderNumber} is now "${status}".`,
      type: "order",
      link: `/orders/${order._id}`,
    }).catch(() => {});
  }

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, order, "Order status updated"));
});

export const updateTracking = asyncHandler(async (req, res) => {
  const { carrier, trackingNumber, trackingUrl } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");

  order.tracking = {
    carrier: carrier ?? order.tracking.carrier,
    trackingNumber: trackingNumber ?? order.tracking.trackingNumber,
    trackingUrl: trackingUrl ?? order.tracking.trackingUrl,
  };
  await order.save();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, order, "Tracking info updated"));
});

export const downloadOrderInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");

  await ensureInvoiceNumber(order);
  const buffer = await getInvoiceBuffer(order);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);
  return res.status(HTTP_STATUS.OK).send(buffer);
});

export const getReturnRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { "returnRequest.status": { $ne: RETURN_STATUS.NONE } };
  if (req.query.status) filter["returnRequest.status"] = req.query.status;

  const [docs, total] = await Promise.all([
    Order.find(filter).populate("customer", "name email").sort({ "returnRequest.requestedAt": -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Return requests fetched"));
});

export const processReturnRequest = asyncHandler(async (req, res) => {
  const { action } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");

  if (order.returnRequest.status !== RETURN_STATUS.REQUESTED) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "This return request has already been processed");
  }

  order.returnRequest.status = action === "approve" ? RETURN_STATUS.APPROVED : RETURN_STATUS.REJECTED;

  if (action === "approve") {
    await appendStatusTimeline(order, ORDER_STATUS.RETURNED, "Return request approved");
    await restoreStock(flattenOrderItemsForStock(order.items));
  } else {
    await order.save();
  }

  const user = await User.findById(order.customer);
  if (user) {
    notifyUser(user._id, {
      title: `Return Request ${action === "approve" ? "Approved" : "Rejected"}`,
      message: `Your return request for order ${order.orderNumber} has been ${action === "approve" ? "approved" : "rejected"}.`,
      type: "return",
      link: `/orders/${order._id}`,
    }).catch(() => {});
  }

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, order, `Return request ${action}d`));
});

export const processRefund = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");

  if (order.returnRequest.status !== RETURN_STATUS.APPROVED) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Refund can only be processed for approved return requests");
  }

  order.refund = { amount, status: REFUND_STATUS.PROCESSED, processedAt: new Date() };
  order.paymentStatus = PAYMENT_STATUS.REFUNDED;
  await appendStatusTimeline(order, ORDER_STATUS.REFUNDED, `Refund of Rs. ${amount} processed`);

  await Payment.findOneAndUpdate({ order: order._id }, { status: PAYMENT_STATUS.REFUNDED });

  const user = await User.findById(order.customer);
  if (user) {
    notifyUser(user._id, {
      title: "Refund Processed",
      message: `A refund of Rs. ${amount} has been processed for order ${order.orderNumber}.`,
      type: "refund",
      link: `/orders/${order._id}`,
    }).catch(() => {});
  }

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, order, "Refund processed"));
});

export const getAdminTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = { ...buildDateRangeFilter(req.query) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.customer) filter.customer = req.query.customer;

  const [docs, total] = await Promise.all([
    Payment.find(filter)
      .populate("customer", "name email")
      .populate("order", "orderNumber grandTotal orderStatus")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Transactions fetched"));
});
