import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    linkedProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

bannerSchema.index({ status: 1, displayOrder: 1 });

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;
