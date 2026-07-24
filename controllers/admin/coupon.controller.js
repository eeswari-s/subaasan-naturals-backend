import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Coupon from "../../models/coupon.model.js";
import { getPagination, buildPaginatedResponse } from "../../helpers/pagination.helper.js";

export const getAdminCoupons = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.code = { $regex: req.query.search, $options: "i" };

  const [docs, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Coupon.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Coupons fetched"));
});

export const createCoupon = asyncHandler(async (req, res) => {
  const existing = await Coupon.findOne({ code: req.body.code.toUpperCase().trim() });
  if (existing) throw new ApiError(HTTP_STATUS.CONFLICT, "A coupon with this code already exists");

  const coupon = await Coupon.create({ ...req.body, code: req.body.code.toUpperCase().trim() });

  return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, coupon, "Coupon created"));
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Coupon not found");

  if (req.body.code && req.body.code.toUpperCase().trim() !== coupon.code) {
    const existing = await Coupon.findOne({ code: req.body.code.toUpperCase().trim(), _id: { $ne: coupon._id } });
    if (existing) throw new ApiError(HTTP_STATUS.CONFLICT, "A coupon with this code already exists");
    coupon.code = req.body.code.toUpperCase().trim();
  }

  const fields = [
    "description",
    "type",
    "value",
    "minOrderValue",
    "maxDiscount",
    "usageLimit",
    "usageLimitPerUser",
    "applicableCategories",
    "applicableProducts",
    "startDate",
    "endDate",
    "status",
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) coupon[field] = req.body[field];
  });

  await coupon.save();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, coupon, "Coupon updated"));
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Coupon not found");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Coupon deleted"));
});
