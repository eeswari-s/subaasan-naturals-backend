import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import PlatformSettings from "../../models/platformSettings.model.js";
import { invalidatePlatformConfigCache } from "../../services/platformConfig.service.js";
import { logActivityFromRequest } from "../../services/activityLog.service.js";

const getOrCreateSettings = async () => {
  let settings = await PlatformSettings.findOne();
  if (!settings) settings = await PlatformSettings.create({});
  return settings;
};

// Payment/email credentials have their own dedicated, masked-secret endpoints
// (see paymentConfig.controller.js / emailConfig.controller.js) — never surface
// them (even encrypted) through the general settings endpoint.
const toPublicSettings = (settings) => {
  const obj = settings.toObject();
  delete obj.payment;
  delete obj.email;
  return obj;
};

export const getPlatformSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, toPublicSettings(settings), "Platform settings fetched"));
});

export const updatePlatformSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  const {
    maintenanceMode,
    maintenanceMessage,
    announcementText,
    announcementActive,
    featureFlags,
    currency,
    timezone,
    taxPercentage,
    defaultDeliveryCharge,
  } = req.body;

  if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
  if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;
  if (announcementText !== undefined) settings.announcementText = announcementText;
  if (announcementActive !== undefined) settings.announcementActive = announcementActive;
  if (featureFlags !== undefined) settings.featureFlags = featureFlags;
  if (currency !== undefined) settings.currency = currency;
  if (timezone !== undefined) settings.timezone = timezone;
  if (taxPercentage !== undefined) settings.taxPercentage = taxPercentage;
  if (defaultDeliveryCharge !== undefined) settings.defaultDeliveryCharge = defaultDeliveryCharge;

  await settings.save();
  invalidatePlatformConfigCache();

  logActivityFromRequest(req, "SuperAdmin", "UPDATED_PLATFORM_SETTINGS", {
    targetType: "PlatformSettings",
    targetId: settings._id,
    metadata: req.body,
  }).catch(() => {});

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, toPublicSettings(settings), "Platform settings updated"));
});
