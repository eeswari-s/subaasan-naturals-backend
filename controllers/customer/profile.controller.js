import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import User from "../../models/user.model.js";
import { uploadImage, deleteImage } from "../../utils/cloudinaryUpload.js";

export const getProfile = asyncHandler(async (req, res) => {
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, req.user.toSafeObject(), "Profile fetched"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (phone) user.phone = phone;

  if (req.file) {
    const oldPublicId = user.avatar?.publicId;
    const uploaded = await uploadImage(req.file.buffer, "profile");
    user.avatar = uploaded;
    if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
  }

  await user.save();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, user.toSafeObject(), "Profile updated"));
});
