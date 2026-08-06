import mongoose from "mongoose";

const DOMAIN_REGEX = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
const GA_MEASUREMENT_ID_REGEX = /^G-[A-Z0-9]+$/;
const GTM_ID_REGEX = /^GTM-[A-Z0-9]+$/;
const META_PIXEL_ID_REGEX = /^\d{6,20}$/;

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate: {
        validator: (value) => DOMAIN_REGEX.test(value),
        message: "Domain must be a bare domain with no protocol or path (e.g. example.com)",
      },
    },
    gaMeasurementId: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (value) => !value || GA_MEASUREMENT_ID_REGEX.test(value),
        message: "Invalid GA4 Measurement ID (expected format: G-XXXXXXX)",
      },
    },
    gtmId: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (value) => !value || GTM_ID_REGEX.test(value),
        message: "Invalid GTM ID (expected format: GTM-XXXXXXX)",
      },
    },
    metaPixelId: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (value) => !value || META_PIXEL_ID_REGEX.test(value),
        message: "Invalid Meta Pixel ID",
      },
    },
    gscVerificationCode: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

clientSchema.index({ name: "text", domain: "text" });

const Client = mongoose.model("Client", clientSchema);

export default Client;
