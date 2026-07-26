import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";
import Combo from "../models/combo.model.js";
import { getPagination, buildPaginatedResponse } from "../helpers/pagination.helper.js";
import { getComboAvailability } from "../services/combo.service.js";

export const getCombos = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { status: "active" };
  if (req.query.isFeatured === "true") filter.isFeatured = true;

  const [docs, total] = await Promise.all([
    Combo.find(filter)
      .populate("items.product", "name slug thumbnail status variants offerPrice sellingPrice stock")
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Combo.countDocuments(filter),
  ]);

  const withAvailability = docs.map((combo) => {
    const { availableStock, originalTotal, savings } = getComboAvailability(combo);
    const obj = combo.toObject();
    return { ...obj, availableStock, originalTotal, savings };
  });

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(withAvailability, total, page, limit), "Combos fetched"));
});

export const getComboBySlug = asyncHandler(async (req, res) => {
  const combo = await Combo.findOne({ slug: req.params.slug, status: "active" }).populate(
    "items.product",
    "name slug thumbnail status variants offerPrice sellingPrice stock"
  );
  if (!combo) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Combo not found");

  const { itemDetails, availableStock, originalTotal, savings } = getComboAvailability(combo);
  const obj = combo.toObject();

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { ...obj, items: itemDetails, availableStock, originalTotal, savings }, "Combo fetched")
  );
});
