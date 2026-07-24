import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import { getRazorpayCredentials, setRazorpayCredentials } from "../../services/platformConfig.service.js";
import { maskSecret } from "../../utils/encryption.js";
import { logActivityFromRequest } from "../../services/activityLog.service.js";

export const getPaymentConfig = asyncHandler(async (req, res) => {
  const { keyId, keySecret, source } = await getRazorpayCredentials();

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        razorpayKeyId: keyId,
        razorpayKeySecret: maskSecret(keySecret),
        source, // "db" if a Super Admin override is active, "env" if still using .env
      },
      "Payment config fetched"
    )
  );
});

export const updatePaymentConfig = asyncHandler(async (req, res) => {
  const { razorpayKeyId, razorpayKeySecret } = req.body;

  await setRazorpayCredentials(razorpayKeyId, razorpayKeySecret);

  logActivityFromRequest(req, "SuperAdmin", "UPDATED_PAYMENT_CONFIG", {
    targetType: "PlatformSettings",
    metadata: { razorpayKeyId },
  }).catch(() => {});

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { razorpayKeyId, razorpayKeySecret: maskSecret(razorpayKeySecret) },
      "Payment config updated — new keys are used for all Razorpay calls immediately"
    )
  );
});
