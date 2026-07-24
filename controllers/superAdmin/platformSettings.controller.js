import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import PlatformSettings from "../../models/platformSettings.model.js";

const getOrCreateSettings = async () => {
  let settings = await PlatformSettings.findOne();
  if (!settings) settings = await PlatformSettings.create({});
  return settings;
};

export const getPlatformSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, settings, "Platform settings fetched"));
});

export const updatePlatformSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  const { maintenanceMode, maintenanceMessage, announcementText, announcementActive, featureFlags } = req.body;

  if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
  if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;
  if (announcementText !== undefined) settings.announcementText = announcementText;
  if (announcementActive !== undefined) settings.announcementActive = announcementActive;
  if (featureFlags !== undefined) settings.featureFlags = featureFlags;

  await settings.save();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, settings, "Platform settings updated"));
});
