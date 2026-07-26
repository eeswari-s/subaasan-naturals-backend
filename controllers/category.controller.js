import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";
import Category from "../models/category.model.js";

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ status: "active" }).sort({ displayOrder: 1, createdAt: -1 });

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, categories, "Categories fetched"));
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, status: "active" });

  if (!category) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Category not found");
  }

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, category, "Category fetched"));
});
