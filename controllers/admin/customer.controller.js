import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import User from "../../models/user.model.js";
import Order from "../../models/order.model.js";
import { getPagination, buildPaginatedResponse } from "../../helpers/pagination.helper.js";

export const getAdminCustomers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.isBlocked !== undefined) filter.isBlocked = req.query.isBlocked === "true";
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
      { phone: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const [docs, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Customers fetched"));
});

export const getAdminCustomerById = asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.id);
  if (!customer) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Customer not found");

  const orders = await Order.find({ customer: customer._id }).sort({ createdAt: -1 }).limit(20);

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { customer, orders }, "Customer fetched"));
});

export const blockCustomer = asyncHandler(async (req, res) => {
  const customer = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true });
  if (!customer) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Customer not found");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, customer, "Customer blocked"));
});

export const unblockCustomer = asyncHandler(async (req, res) => {
  const customer = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
  if (!customer) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Customer not found");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, customer, "Customer unblocked"));
});
