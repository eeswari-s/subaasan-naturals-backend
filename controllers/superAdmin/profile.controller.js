import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import SuperAdmin from "../../models/superAdmin.model.js";
import { uploadImage, deleteImage } from "../../utils/cloudinaryUpload.js";
import { logActivityFromRequest } from "../../services/activityLog.service.js";

export const getProfile = asyncHandler(async (req, res) => {
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, req.superAdmin, "Profile fetched"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const superAdmin = await SuperAdmin.findById(req.superAdmin._id);

  if (name) superAdmin.name = name;
  if (phone) superAdmin.phone = phone;

  if (req.file) {
    const oldPublicId = superAdmin.avatar?.publicId;
    superAdmin.avatar = await uploadImage(req.file.buffer, "profile");
    if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
  }

  await superAdmin.save();

  logActivityFromRequest(req, "SuperAdmin", "UPDATED_PROFILE").catch(() => {});

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, superAdmin, "Profile updated"));
});
