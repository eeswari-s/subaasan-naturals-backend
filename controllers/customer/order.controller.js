import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Order from "../../models/order.model.js";
import Cart from "../../models/cart.model.js";
import Product from "../../models/product.model.js";
import { getPagination, buildPaginatedResponse } from "../../helpers/pagination.helper.js";
import { emailInvoiceToCustomer, ensureInvoiceNumber, getInvoiceBuffer } from "../../services/invoice.service.js";
import { uploadImage } from "../../utils/cloudinaryUpload.js";
import { ORDER_STATUS, RETURN_STATUS } from "../../constants/orderStatus.js";

export const getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { customer: req.user._id };
  if (req.query.status) filter.orderStatus = req.query.status;

  const [docs, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Orders fetched"));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id }).populate(
    "coupon",
    "code type value"
  );
  if (!order) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, order, "Order fetched"));
});

export const buyAgain = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const skipped = [];

  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product || product.status !== "active") {
      skipped.push(item.productNameSnapshot);
      continue;
    }

    let availableStock = product.stock;
    if (item.variantName) {
      const variant = product.variants.find((v) => v.variantName === item.variantName);
      if (!variant) {
        skipped.push(item.productNameSnapshot);
        continue;
      }
      availableStock = variant.stock;
    }

    if (availableStock < 1) {
      skipped.push(item.productNameSnapshot);
      continue;
    }

    const existingItem = cart.items.find(
      (i) => i.product.toString() === item.product.toString() && i.variantName === item.variantName
    );
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cart.items.push({ product: item.product, variantName: item.variantName, quantity: item.quantity });
    }
  }

  await cart.save();

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, { cart, skipped }, "Items added to cart"));
});

export const requestReturn = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");

  if (order.orderStatus !== ORDER_STATUS.DELIVERED) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Only delivered orders can be returned");
  }

  if (order.returnRequest.status !== RETURN_STATUS.NONE) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "A return request already exists for this order");
  }

  const images = req.files?.length
    ? await Promise.all(req.files.map((file) => uploadImage(file.buffer, "returns")))
    : [];

  order.returnRequest = {
    reason,
    images,
    status: RETURN_STATUS.REQUESTED,
    requestedAt: new Date(),
  };
  await order.save();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, order, "Return request submitted"));
});

export const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");

  await ensureInvoiceNumber(order);
  const buffer = await getInvoiceBuffer(order);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);
  return res.status(HTTP_STATUS.OK).send(buffer);
});

export const emailInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");

  await emailInvoiceToCustomer(order, req.user);

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Invoice emailed successfully"));
});
