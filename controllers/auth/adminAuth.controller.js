import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import { ROLES } from "../../constants/roles.js";
import Admin from "../../models/admin.model.js";
import Otp from "../../models/otp.model.js";
import RefreshToken from "../../models/refreshToken.model.js";
import generateOtp from "../../utils/generateOtp.js";
import { generateTokens, generateAccessToken, hashToken, getTokenExpiryDate, verifyRefreshToken } from "../../utils/generateTokens.js";
import { sendOtpEmail, sendForgotPasswordEmail } from "../../services/email.service.js";
import env from "../../config/env.js";

const REFRESH_COOKIE_NAME = "adminRefreshToken";
const OTP_EXPIRY_MINUTES = 10;

const cookieOptions = (expiresAt) => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  expires: expiresAt,
});

const issueSession = async (res, admin) => {
  const { accessToken, refreshToken } = generateTokens({ id: admin._id, role: ROLES.ADMIN });
  const expiresAt = getTokenExpiryDate(refreshToken);

  await RefreshToken.create({
    user: admin._id,
    userModel: "Admin",
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions(expiresAt));
  return accessToken;
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin || !(await admin.comparePassword(password))) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid email or password");
  }

  if (!admin.isActive) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Your admin account has been deactivated");
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const accessToken = await issueSession(res, admin);

  const safeAdmin = admin.toObject();
  delete safeAdmin.password;

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, { admin: safeAdmin, accessToken }, "Login successful"));
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Refresh token missing");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  if (decoded.role !== ROLES.ADMIN) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Invalid token role");
  }

  const tokenHash = hashToken(token);
  const storedToken = await RefreshToken.findOne({ tokenHash, user: decoded.id });
  if (!storedToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Refresh token has been revoked");
  }

  const admin = await Admin.findById(decoded.id);
  if (!admin || !admin.isActive) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Account is unavailable");
  }

  const accessToken = generateAccessToken({ id: admin._id, role: ROLES.ADMIN });

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { accessToken }, "Token refreshed"));
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) {
    await RefreshToken.deleteOne({ tokenHash: hashToken(token) });
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "strict" });
  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Logged out successfully"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, null, "If an account exists with this email, an OTP has been sent"));
  }

  const otp = generateOtp();
  const otpHash = hashToken(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.create({ email, userType: "admin", otpHash, purpose: "password-reset", expiresAt });

  sendForgotPasswordEmail(admin.email, admin.name, otp).catch(() => {});

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, null, "If an account exists with this email, an OTP has been sent"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const otpRecord = await Otp.findOne({
    email,
    userType: "admin",
    purpose: "password-reset",
    consumed: false,
  }).sort({ createdAt: -1 });

  if (!otpRecord || otpRecord.expiresAt < new Date() || otpRecord.otpHash !== hashToken(otp)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid or expired OTP");
  }

  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Account not found");
  }

  admin.password = newPassword;
  await admin.save();

  otpRecord.consumed = true;
  await otpRecord.save();

  await RefreshToken.deleteMany({ user: admin._id });

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Password reset successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.admin._id).select("+password");
  if (!(await admin.comparePassword(oldPassword))) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Old password is incorrect");
  }

  admin.password = newPassword;
  await admin.save();

  const currentToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const currentHash = currentToken ? hashToken(currentToken) : null;
  await RefreshToken.deleteMany({ user: admin._id, ...(currentHash && { tokenHash: { $ne: currentHash } }) });

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Password changed successfully"));
});
