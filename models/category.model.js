import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    description: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

categorySchema.index({ status: 1, displayOrder: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
