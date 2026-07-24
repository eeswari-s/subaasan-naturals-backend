import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Banner from "../../models/banner.model.js";
import { uploadImage, deleteImage } from "../../utils/cloudinaryUpload.js";

const MAX_ACTIVE_BANNERS = 4;

const assertActiveBannerCapacity = async (excludeId = null) => {
  const filter = { status: "active" };
  if (excludeId) filter._id = { $ne: excludeId };
  const activeCount = await Banner.countDocuments(filter);
  if (activeCount >= MAX_ACTIVE_BANNERS) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Only ${MAX_ACTIVE_BANNERS} active banners are allowed at a time`);
  }
};

export const getAdminBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 }).populate("linkedProduct", "name slug");
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, banners, "Banners fetched"));
});

export const createBanner = asyncHandler(async (req, res) => {
  const { title, subtitle, linkedProduct, displayOrder, status = "active" } = req.body;

  if (status === "active") {
    await assertActiveBannerCapacity();
  }

  if (!req.file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Banner image is required");
  }

  const image = await uploadImage(req.file.buffer, "banners");

  const banner = await Banner.create({ title, subtitle, linkedProduct: linkedProduct || null, displayOrder, status, image });

  return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, banner, "Banner created"));
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Banner not found");

  const { title, subtitle, linkedProduct, displayOrder, status } = req.body;

  if (status === "active" && banner.status !== "active") {
    await assertActiveBannerCapacity(banner._id);
  }

  if (title !== undefined) banner.title = title;
  if (subtitle !== undefined) banner.subtitle = subtitle;
  if (linkedProduct !== undefined) banner.linkedProduct = linkedProduct || null;
  if (displayOrder !== undefined) banner.displayOrder = displayOrder;
  if (status !== undefined) banner.status = status;

  if (req.file) {
    const oldPublicId = banner.image?.publicId;
    banner.image = await uploadImage(req.file.buffer, "banners");
    if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
  }

  await banner.save();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, banner, "Banner updated"));
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Banner not found");

  if (banner.image?.publicId) deleteImage(banner.image.publicId).catch(() => {});
  await banner.deleteOne();

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Banner deleted"));
});
