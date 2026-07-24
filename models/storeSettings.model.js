import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: "Subaasan Naturals" },
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    favicon: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    contact: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
    },
    socialLinks: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

const StoreSettings = mongoose.model("StoreSettings", storeSettingsSchema);

export default StoreSettings;
