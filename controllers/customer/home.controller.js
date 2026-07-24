import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import Banner from "../../models/banner.model.js";
import Category from "../../models/category.model.js";
import Product from "../../models/product.model.js";
import Coupon from "../../models/coupon.model.js";

const PRODUCT_PREVIEW_FIELDS =
  "name slug thumbnail mrp sellingPrice offerPrice discountPercentage averageRating totalReviews stock";

export const getHomeData = asyncHandler(async (req, res) => {
  const now = new Date();

  const [banners, categories, featuredProducts, trendingProducts, bestSellers, newArrivals, todaysDeals, activeCoupons] =
    await Promise.all([
      Banner.find({ status: "active" }).sort({ displayOrder: 1 }).limit(4).populate("linkedProduct", "name slug"),
      Category.find({ status: "active", parent: null }).sort({ displayOrder: 1 }).limit(12),
      Product.find({ status: "active", isFeatured: true }).select(PRODUCT_PREVIEW_FIELDS).limit(12),
      Product.find({ status: "active", isTrending: true }).select(PRODUCT_PREVIEW_FIELDS).limit(12),
      Product.find({ status: "active", isBestSeller: true }).select(PRODUCT_PREVIEW_FIELDS).limit(12),
      Product.find({ status: "active", isNewArrival: true }).select(PRODUCT_PREVIEW_FIELDS).sort({ createdAt: -1 }).limit(12),
      Product.find({ status: "active", isTodaysDeal: true }).select(PRODUCT_PREVIEW_FIELDS).limit(12),
      Coupon.find({ status: "active", startDate: { $lte: now }, endDate: { $gte: now } }).select(
        "code description type value minOrderValue maxDiscount endDate"
      ),
    ]);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { banners, categories, featuredProducts, trendingProducts, bestSellers, newArrivals, todaysDeals, activeCoupons },
      "Home data fetched"
    )
  );
});
