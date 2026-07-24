import mongoose from "mongoose";

const imageSubSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema({
  variantName: { type: String, required: true },
  images: [imageSubSchema],
  mrp: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  offerPrice: { type: Number, min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  totalStock: { type: Number, required: true, default: 0, min: 0 },
  lowStockLimit: { type: Number, default: 5 },
});

variantSchema.virtual("stockStatus").get(function stockStatusGetter() {
  if (this.stock <= 0) return "out-of-stock";
  if (this.stock <= this.lowStockLimit) return "low-stock";
  return "in-stock";
});
variantSchema.set("toJSON", { virtuals: true });
variantSchema.set("toObject", { virtuals: true });

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: String, trim: true, default: "" },

    shortDescription: { type: String, default: "" },
    fullDescription: { type: String, default: "" },

    thumbnail: imageSubSchema,
    galleryImages: [imageSubSchema],

    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    offerPrice: { type: Number, min: 0 },
    discountPercentage: { type: Number, default: 0 },

    variants: [variantSchema],

    highlights: [{ type: String }],

    ingredients: { type: String, default: "" },
    shelfLife: { type: String, default: "" },
    storageInstructions: { type: String, default: "" },
    manufacturer: { type: String, default: "" },
    countryOfOrigin: { type: String, default: "" },
    fssaiNumber: { type: String, default: "" },
    netQuantity: { type: String, default: "" },

    couponApplicable: { type: Boolean, default: true },

    freeShipping: { type: Boolean, default: false },
    deliveryCharge: { type: Number, default: 0 },
    estimatedDeliveryDays: { type: Number, default: 5 },

    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
    cartCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },

    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isTodaysDeal: { type: Boolean, default: false },

    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    stock: { type: Number, default: 0, min: 0 },

    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive", "draft"], default: "active" },
  },
  { timestamps: true }
);

productSchema.pre("save", function computeDiscount(next) {
  const effectivePrice = this.offerPrice || this.sellingPrice;
  if (this.mrp > 0) {
    this.discountPercentage = Math.round(((this.mrp - effectivePrice) / this.mrp) * 100);
  }

  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }

  next();
});

productSchema.index({ name: "text", shortDescription: "text", fullDescription: "text", brand: "text" });
productSchema.index({ category: 1, status: 1, createdAt: -1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ isBestSeller: 1, status: 1 });
productSchema.index({ isTrending: 1, status: 1 });
productSchema.index({ isNewArrival: 1, status: 1 });
productSchema.index({ isTodaysDeal: 1, status: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
