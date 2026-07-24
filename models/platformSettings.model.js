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
  },
  { timestamps: true }
);

const PlatformSettings = mongoose.model("PlatformSettings", platformSettingsSchema);

export default PlatformSettings;
