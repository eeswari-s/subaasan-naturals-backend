import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";
import Client from "../models/client.model.js";

export const getAnalyticsConfig = asyncHandler(async (req, res) => {
  const { domain } = req.query;
  if (!domain) throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Domain query parameter is required");

  const normalizedDomain = String(domain).trim().toLowerCase().replace(/^www\./, "");

  const client = await Client.findOne({ domain: normalizedDomain, isActive: true }).select(
    "gaMeasurementId gtmId metaPixelId gscVerificationCode -_id"
  );

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, client, "Analytics config fetched"));
});
