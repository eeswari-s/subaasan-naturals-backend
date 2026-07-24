import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, default: "" },
    reviewImages: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    status: { type: String, enum: ["visible", "hidden"], default: "visible" },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ customer: 1, product: 1, order: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
