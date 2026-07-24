import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    storeId: { type: String, default: "subaasan-naturals" },
    storeName: { type: String, default: "Subaasan Naturals" },
    category: { type: String, default: "General" },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    thumbnail: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    shortDescription: { type: String, default: "" },
    content: { type: String, required: true },
    views: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedDate: { type: Date, default: null },
  },
  { timestamps: true }
);

blogSchema.index({ status: 1, publishedDate: -1 });

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
