import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Review from "../../models/review.model.js";
import { getPagination, buildPaginatedResponse } from "../../helpers/pagination.helper.js";
import { deleteImages } from "../../utils/cloudinaryUpload.js";
import { recalculateProductRating } from "../../services/product.service.js";

export const getAdminReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.product) filter.product = req.query.product;

  const [docs, total] = await Promise.all([
    Review.find(filter)
      .populate("customer", "name email")
      .populate("product", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Reviews fetched"));
});

export const toggleReviewVisibility = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Review not found");

  review.status = review.status === "visible" ? "hidden" : "visible";
  await review.save();
  await recalculateProductRating(review.product);

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, review, `Review ${review.status}`));
});

export const deleteAdminReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Review not found");

  deleteImages(review.reviewImages.map((img) => img.publicId)).catch(() => {});
  await recalculateProductRating(review.product);

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Review deleted"));
});
