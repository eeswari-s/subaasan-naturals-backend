import mongoose from "mongoose";
import Product from "../models/product.model.js";
import Review from "../models/review.model.js";
import Order from "../models/order.model.js";

export const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: "visible" } },
    { $group: { _id: "$product", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
  ]);

  const { averageRating = 0, totalReviews = 0 } = stats[0] || {};

  await Product.findByIdAndUpdate(productId, {
    averageRating: Number(averageRating.toFixed(1)),
    totalReviews,
  });
};

export const incrementViewCount = (productId) => Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } });

export const incrementWishlistCount = (productId, delta = 1) =>
  Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: delta } });

export const incrementCartCount = (productId, delta = 1) =>
  Product.findByIdAndUpdate(productId, { $inc: { cartCount: delta } });

export const incrementSoldCount = (productId, quantity) =>
  Product.findByIdAndUpdate(productId, { $inc: { soldCount: quantity } });

export const getRelatedProducts = async (product, limit = 8) =>
  Product.find({
    _id: { $ne: product._id },
    category: product.category,
    status: "active",
  })
    .limit(limit)
    .select("name slug thumbnail mrp sellingPrice offerPrice discountPercentage averageRating");

export const getFrequentlyBoughtTogether = async (productId, limit = 6) => {
  const curated = await Product.findById(productId).select("relatedProducts");
  if (curated?.relatedProducts?.length) {
    return Product.find({ _id: { $in: curated.relatedProducts }, status: "active" })
      .limit(limit)
      .select("name slug thumbnail mrp sellingPrice offerPrice discountPercentage averageRating");
  }

  const coOccurrence = await Order.aggregate([
    { $match: { "items.product": new mongoose.Types.ObjectId(productId) } },
    { $unwind: "$items" },
    { $match: { "items.product": { $ne: new mongoose.Types.ObjectId(productId) } } },
    { $group: { _id: "$items.product", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

  const ids = coOccurrence.map((c) => c._id);
  return Product.find({ _id: { $in: ids }, status: "active" }).select(
    "name slug thumbnail mrp sellingPrice offerPrice discountPercentage averageRating"
  );
};

export const buildShareLink = (product, clientUrl) => {
  const productUrl = `${clientUrl}/products/${product.slug}`;
  const text = encodeURIComponent(`Check out ${product.name} - ${product.shortDescription || ""}\n${productUrl}`);
  return `https://wa.me/?text=${text}`;
};
