import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import StoreSettings from "../../models/storeSettings.model.js";
import { uploadImage, deleteImage } from "../../utils/cloudinaryUpload.js";

const getOrCreateSettings = async () => {
  let settings = await StoreSettings.findOne();
  if (!settings) settings = await StoreSettings.create({});
  return settings;
};

export const getStoreSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, settings, "Store settings fetched"));
});

export const updateStoreSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  const { storeName, contact, socialLinks } = req.body;

  if (storeName) settings.storeName = storeName;
  if (contact) settings.contact = { ...settings.contact.toObject(), ...contact };
  if (socialLinks) settings.socialLinks = socialLinks;

  if (req.files?.logo?.[0]) {
    const oldPublicId = settings.logo?.publicId;
    settings.logo = await uploadImage(req.files.logo[0].buffer, "store");
    if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
  }

  if (req.files?.favicon?.[0]) {
    const oldPublicId = settings.favicon?.publicId;
    settings.favicon = await uploadImage(req.files.favicon[0].buffer, "store");
    if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
  }

  await settings.save();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, settings, "Store settings updated"));
});
