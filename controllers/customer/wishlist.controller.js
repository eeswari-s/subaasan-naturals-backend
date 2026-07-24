import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Wishlist from "../../models/wishlist.model.js";
import Product from "../../models/product.model.js";
import { incrementWishlistCount } from "../../services/product.service.js";

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: "products",
    select: "name slug thumbnail mrp sellingPrice offerPrice discountPercentage averageRating stock status",
  });

  const products = (wishlist?.products || []).filter((p) => p.status === "active");

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, products, "Wishlist fetched"));
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const product = await Product.findOne({ _id: productId, status: "active" });
  if (!product) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { products: productId } },
    { upsert: true, new: true }
  );

  incrementWishlistCount(productId, 1).catch(() => {});

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, wishlist, "Added to wishlist"));
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: productId } },
    { new: true }
  );

  incrementWishlistCount(productId, -1).catch(() => {});

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, wishlist, "Removed from wishlist"));
});
