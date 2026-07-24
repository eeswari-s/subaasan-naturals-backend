import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Review from "../../models/review.model.js";
import Order from "../../models/order.model.js";
import { getPagination, buildPaginatedResponse } from "../../helpers/pagination.helper.js";
import { uploadImages, deleteImages } from "../../utils/cloudinaryUpload.js";
import { recalculateProductRating } from "../../services/product.service.js";
import { ORDER_STATUS } from "../../constants/orderStatus.js";

export const getProductReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = { product: req.params.productId, status: "visible" };

  const [docs, total] = await Promise.all([
    Review.find(filter).populate("customer", "name avatar").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Reviews fetched"));
});

export const createReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, reviewText } = req.body;

  const order = await Order.findOne({
    _id: orderId,
    customer: req.user._id,
    orderStatus: ORDER_STATUS.DELIVERED,
    "items.product": productId,
  });

  if (!order) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "You can only review products from your delivered orders");
  }

  const existingReview = await Review.findOne({ customer: req.user._id, product: productId, order: orderId });
  if (existingReview) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "You have already reviewed this product for this order");
  }

  const reviewImages = req.files?.length ? await uploadImages(req.files.map((f) => f.buffer), "reviews") : [];

  const review = await Review.create({
    customer: req.user._id,
    product: productId,
    order: orderId,
    rating,
    reviewText,
    reviewImages,
  });

  await recalculateProductRating(productId);

  return res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, review, "Review submitted"));
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, customer: req.user._id });
  if (!review) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Review not found");

  const { rating, reviewText } = req.body;
  if (rating) review.rating = rating;
  if (reviewText !== undefined) review.reviewText = reviewText;

  if (req.files?.length) {
    const oldPublicIds = review.reviewImages.map((img) => img.publicId);
    review.reviewImages = await uploadImages(req.files.map((f) => f.buffer), "reviews");
    deleteImages(oldPublicIds).catch(() => {});
  }

  await review.save();
  await recalculateProductRating(review.product);

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, review, "Review updated"));
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id, customer: req.user._id });
  if (!review) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Review not found");

  deleteImages(review.reviewImages.map((img) => img.publicId)).catch(() => {});
  await recalculateProductRating(review.product);

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Review deleted"));
});
