import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Address from "../../models/address.model.js";

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, addresses, "Addresses fetched"));
});

export const createAddress = asyncHandler(async (req, res) => {
  const payload = { ...req.body, user: req.user._id };

  if (payload.isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  } else {
    const existingCount = await Address.countDocuments({ user: req.user._id });
    if (existingCount === 0) payload.isDefault = true;
  }

  const address = await Address.create(payload);
  return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, address, "Address added"));
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Address not found");

  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  Object.assign(address, req.body);
  await address.save();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, address, "Address updated"));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Address not found");

  if (address.isDefault) {
    const nextAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Address deleted"));
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Address not found");

  await Address.updateMany({ user: req.user._id }, { isDefault: false });
  address.isDefault = true;
  await address.save();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, address, "Default address updated"));
});
