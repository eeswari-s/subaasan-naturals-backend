import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";
import Product from "../models/product.model.js";
import RecentlyViewed from "../models/recentlyViewed.model.js";
import { getPagination, buildPaginatedResponse, getSort } from "../helpers/pagination.helper.js";
import { buildProductFilter } from "../helpers/filter.helper.js";
import {
  incrementViewCount,
  getRelatedProducts,
  getFrequentlyBoughtTogether,
  buildShareLink,
} from "../services/product.service.js";
import env from "../config/env.js";

export const getProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildProductFilter(req.query);
  const sort = getSort(req.query);

  const [docs, total] = await Promise.all([
    Product.find(filter).populate("category", "name slug").sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, buildPaginatedResponse(docs, total, page, limit), "Products fetched"));
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: "active" }).populate("category", "name slug");

  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  incrementViewCount(product._id).catch(() => {});

  if (req.user) {
    RecentlyViewed.findOneAndUpdate(
      { user: req.user._id },
      {
        $pull: { products: { product: product._id } },
      },
      { upsert: true }
    )
      .then(() =>
        RecentlyViewed.findOneAndUpdate(
          { user: req.user._id },
          {
            $push: {
              products: {
                $each: [{ product: product._id, viewedAt: new Date() }],
                $position: 0,
                $slice: RecentlyViewed.MAX_ITEMS,
              },
            },
          },
          { upsert: true }
        )
      )
      .catch(() => {});
  }

  const [relatedProducts, frequentlyBoughtTogether] = await Promise.all([
    getRelatedProducts(product),
    getFrequentlyBoughtTogether(product._id),
  ]);

  const shareLink = buildShareLink(product, env.CLIENT_URL);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { product, relatedProducts, frequentlyBoughtTogether, shareLink },
      "Product fetched"
    )
  );
});

export const getRecentlyViewedProducts = asyncHandler(async (req, res) => {
  const record = await RecentlyViewed.findOne({ user: req.user._id }).populate({
    path: "products.product",
    select: "name slug thumbnail mrp sellingPrice offerPrice discountPercentage averageRating status",
  });

  const products = (record?.products || [])
    .filter((entry) => entry.product && entry.product.status === "active")
    .map((entry) => entry.product);

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, products, "Recently viewed products"));
});
