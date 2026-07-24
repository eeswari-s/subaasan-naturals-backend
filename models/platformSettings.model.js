import mongoose from "mongoose";

const platformSettingsSchema = new mongoose.Schema(
  {
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "" },
    announcementText: { type: String, default: "" },
    announcementActive: { type: Boolean, default: false },
    featureFlags: {
      type: Map,
      of: Boolean,
      default: {},
    },

    currency: { type: String, default: "INR" },
    timezone: { type: String, default: "Asia/Kolkata" },
    taxPercentage: { type: Number, default: null }, // null = fall back to env.TAX_PERCENTAGE
    defaultDeliveryCharge: { type: Number, default: null }, // null = fall back to env.DEFAULT_SHIPPING_CHARGE

    payment: {
      razorpayKeyId: { type: String, default: "" },
      razorpayKeySecretEncrypted: { type: String, default: "" },
    },

    email: {
      brevoApiKeyEncrypted: { type: String, default: "" },
      senderEmail: { type: String, default: "" },
      senderName: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

const PlatformSettings = mongoose.model("PlatformSettings", platformSettingsSchema);

export default PlatformSettings;
