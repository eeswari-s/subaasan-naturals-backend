import mongoose from "mongoose";

const cmsPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ["privacy-policy", "terms-and-conditions", "contact-us"],
    },
    title: { type: String, required: true },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

const CmsPage = mongoose.model("CmsPage", cmsPageSchema);

export default CmsPage;
