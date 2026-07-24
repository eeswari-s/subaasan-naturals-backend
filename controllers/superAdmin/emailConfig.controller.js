import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import { getEmailCredentials, setEmailCredentials } from "../../services/platformConfig.service.js";
import { maskSecret } from "../../utils/encryption.js";
import { sendTestEmail } from "../../services/email.service.js";
import { logActivityFromRequest } from "../../services/activityLog.service.js";

export const getEmailConfig = asyncHandler(async (req, res) => {
  const { apiKey, senderEmail, senderName, source } = await getEmailCredentials();

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        brevoApiKey: maskSecret(apiKey),
        senderEmail,
        senderName,
        source,
      },
      "Email config fetched"
    )
  );
});

export const updateEmailConfig = asyncHandler(async (req, res) => {
  const { brevoApiKey, senderEmail, senderName } = req.body;

  await setEmailCredentials({ apiKey: brevoApiKey, senderEmail, senderName });

  logActivityFromRequest(req, "SuperAdmin", "UPDATED_EMAIL_CONFIG", {
    targetType: "PlatformSettings",
    metadata: { senderEmail, senderName },
  }).catch(() => {});

  const updated = await getEmailCredentials();

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { brevoApiKey: maskSecret(updated.apiKey), senderEmail: updated.senderEmail, senderName: updated.senderName },
      "Email config updated"
    )
  );
});

export const testEmailConfig = asyncHandler(async (req, res) => {
  const { to } = req.body;

  try {
    const { senderEmail } = await sendTestEmail(to);

    logActivityFromRequest(req, "SuperAdmin", "SENT_TEST_EMAIL", { metadata: { to } }).catch(() => {});

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, { to, from: senderEmail }, `Test email sent successfully to ${to}`)
    );
  } catch (error) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Test email failed: ${error.message}`);
  }
});
