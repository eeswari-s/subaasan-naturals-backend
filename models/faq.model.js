import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, default: "General" },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

faqSchema.index({ status: 1, category: 1, displayOrder: 1 });

const Faq = mongoose.model("Faq", faqSchema);

export default Faq;
