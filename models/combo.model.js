import mongoose from "mongoose";

const comboItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantName: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const comboSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    thumbnail: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    items: {
      type: [comboItemSchema],
      validate: {
        validator: (items) => items.length >= 2,
        message: "A combo must contain at least 2 products",
      },
    },
    comboPrice: { type: Number, required: true, min: 0 },
    displayOrder: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive", "draft"], default: "active" },
  },
  { timestamps: true }
);

comboSchema.index({ status: 1, displayOrder: 1 });

const Combo = mongoose.model("Combo", comboSchema);

export default Combo;
