import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Combo from "../../models/combo.model.js";
import Product from "../../models/product.model.js";
import { getPagination, buildPaginatedResponse } from "../../helpers/pagination.helper.js";
import { generateUniqueSlug } from "../../helpers/slugify.helper.js";
import { uploadImage, deleteImage } from "../../utils/cloudinaryUpload.js";
import { logActivityFromRequest } from "../../services/activityLog.service.js";

const parseItems = (raw) => {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return parsed.map((item) => ({
    product: item.product,
    variantName: item.variantName || null,
    quantity: Number(item.quantity) || 1,
  }));
};

const assertProductsExist = async (items) => {
  const ids = [...new Set(items.map((i) => i.product))];
  const count = await Product.countDocuments({ _id: { $in: ids } });
  if (count !== ids.length) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "One or more products in this combo do not exist");
  }
};

export const getAdminCombos = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: "i" };

  const [docs, total] = await Promise.all([
    Combo.find(filter).populate("items.product", "name slug thumbnail").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Combo.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Combos fetched"));
});

export const getAdminComboById = asyncHandler(async (req, res) => {
  const combo = await Combo.findById(req.params.id).populate("items.product", "name slug thumbnail variants sellingPrice offerPrice");
  if (!combo) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Combo not found");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, combo, "Combo fetched"));
});

export const createCombo = asyncHandler(async (req, res) => {
  const { name, shortDescription, description, comboPrice, displayOrder, status, isFeatured } = req.body;

  const items = parseItems(req.body.items);
  await assertProductsExist(items);

  const slug = await generateUniqueSlug(Combo, name);

  let thumbnail = null;
  if (req.file) thumbnail = await uploadImage(req.file.buffer, "combos");

  const combo = await Combo.create({
    name,
    slug,
    shortDescription,
    description,
    comboPrice,
    displayOrder,
    status,
    isFeatured,
    thumbnail,
    items,
  });

  logActivityFromRequest(req, "Admin", "CREATED_COMBO", { targetType: "Combo", targetId: combo._id }).catch(() => {});

  return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, combo, "Combo created"));
});

export const updateCombo = asyncHandler(async (req, res) => {
  const combo = await Combo.findById(req.params.id);
  if (!combo) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Combo not found");

  const { name, shortDescription, description, comboPrice, displayOrder, status, isFeatured } = req.body;

  if (name && name !== combo.name) {
    combo.slug = await generateUniqueSlug(Combo, name, combo._id);
    combo.name = name;
  }
  if (shortDescription !== undefined) combo.shortDescription = shortDescription;
  if (description !== undefined) combo.description = description;
  if (comboPrice !== undefined) combo.comboPrice = comboPrice;
  if (displayOrder !== undefined) combo.displayOrder = displayOrder;
  if (status !== undefined) combo.status = status;
  if (isFeatured !== undefined) combo.isFeatured = isFeatured;

  if (req.body.items !== undefined) {
    const items = parseItems(req.body.items);
    await assertProductsExist(items);
    combo.items = items;
  }

  if (req.file) {
    const oldPublicId = combo.thumbnail?.publicId;
    combo.thumbnail = await uploadImage(req.file.buffer, "combos");
    if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
  }

  await combo.save();

  logActivityFromRequest(req, "Admin", "UPDATED_COMBO", { targetType: "Combo", targetId: combo._id }).catch(() => {});

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, combo, "Combo updated"));
});

export const deleteCombo = asyncHandler(async (req, res) => {
  const combo = await Combo.findById(req.params.id);
  if (!combo) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Combo not found");

  if (combo.thumbnail?.publicId) deleteImage(combo.thumbnail.publicId).catch(() => {});
  await combo.deleteOne();

  logActivityFromRequest(req, "Admin", "DELETED_COMBO", { targetType: "Combo", targetId: req.params.id }).catch(() => {});

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Combo deleted"));
});
