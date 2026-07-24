import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import CmsPage from "../../models/cmsPage.model.js";
import StoreSettings from "../../models/storeSettings.model.js";

export const getCmsPage = asyncHandler(async (req, res) => {
  const page = await CmsPage.findOne({ slug: req.params.slug });
  if (!page) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Page not found");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, page, "Page fetched"));
});

export const getContactInfo = asyncHandler(async (req, res) => {
  const settings = await StoreSettings.findOne().select("storeName contact socialLinks");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, settings, "Contact info fetched"));
});
