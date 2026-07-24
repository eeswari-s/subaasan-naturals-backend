import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    userType: { type: String, enum: ["customer", "admin", "superAdmin"], required: true },
    otpHash: { type: String, required: true },
    resetTokenHash: { type: String, default: null },
    purpose: { type: String, enum: ["registration", "password-reset"], required: true },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, userType: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
