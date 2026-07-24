import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";
import Coupon from "../models/coupon.model.js";

export const getActiveCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    status: "active",
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).select("code description type value minOrderValue maxDiscount endDate");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, coupons, "Active offers fetched"));
});
