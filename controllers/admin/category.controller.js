import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Category from "../../models/category.model.js";
import { getPagination, buildPaginatedResponse } from "../../helpers/pagination.helper.js";
import { generateUniqueSlug } from "../../helpers/slugify.helper.js";
import { uploadImage, deleteImage } from "../../utils/cloudinaryUpload.js";
import { logActivityFromRequest } from "../../services/activityLog.service.js";

export const getAdminCategories = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: "i" };

  const [docs, total] = await Promise.all([
    Category.find(filter).populate("parent", "name slug").sort({ displayOrder: 1, createdAt: -1 }).skip(skip).limit(limit),
    Category.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Categories fetched"));
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, parent, description, displayOrder, status } = req.body;

  const slug = await generateUniqueSlug(Category, name);
  let image = null;
  if (req.file) {
    image = await uploadImage(req.file.buffer, "categories");
  }

  const category = await Category.create({ name, slug, parent: parent || null, description, displayOrder, status, image });

  logActivityFromRequest(req, "Admin", "CREATED_CATEGORY", { targetType: "Category", targetId: category._id }).catch(() => {});

  return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, category, "Category created"));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Category not found");

  const { name, parent, description, displayOrder, status } = req.body;

  if (name && name !== category.name) {
    category.slug = await generateUniqueSlug(Category, name, category._id);
    category.name = name;
  }
  if (parent !== undefined) category.parent = parent || null;
  if (description !== undefined) category.description = description;
  if (displayOrder !== undefined) category.displayOrder = displayOrder;
  if (status !== undefined) category.status = status;

  if (req.file) {
    const oldPublicId = category.image?.publicId;
    category.image = await uploadImage(req.file.buffer, "categories");
    if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
  }

  await category.save();

  logActivityFromRequest(req, "Admin", "UPDATED_CATEGORY", { targetType: "Category", targetId: category._id }).catch(() => {});

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, category, "Category updated"));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Category not found");

  if (category.image?.publicId) deleteImage(category.image.publicId).catch(() => {});
  await category.deleteOne();

  logActivityFromRequest(req, "Admin", "DELETED_CATEGORY", { targetType: "Category", targetId: req.params.id }).catch(() => {});

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Category deleted"));
});
