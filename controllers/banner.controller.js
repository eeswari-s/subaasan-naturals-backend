import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";
import Banner from "../models/banner.model.js";

export const getActiveBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({ status: "active" })
    .sort({ displayOrder: 1, createdAt: -1 })
    .populate("linkedProduct", "name slug thumbnail");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, banners, "Banners fetched"));
});
