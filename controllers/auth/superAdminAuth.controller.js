import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import { ROLES } from "../../constants/roles.js";
import SuperAdmin from "../../models/superAdmin.model.js";
import Otp from "../../models/otp.model.js";
import RefreshToken from "../../models/refreshToken.model.js";
import generateOtp from "../../utils/generateOtp.js";
import { generateTokens, generateAccessToken, hashToken, getTokenExpiryDate, verifyRefreshToken } from "../../utils/generateTokens.js";
import { sendForgotPasswordEmail } from "../../services/email.service.js";
import { logActivity } from "../../services/activityLog.service.js";
import env from "../../config/env.js";

const REFRESH_COOKIE_NAME = "superAdminRefreshToken";
const OTP_EXPIRY_MINUTES = 10;

const cookieOptions = (expiresAt) => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  expires: expiresAt,
});

const issueSession = async (res, superAdmin) => {
  const { accessToken, refreshToken } = generateTokens({ id: superAdmin._id, role: ROLES.SUPER_ADMIN });
  const expiresAt = getTokenExpiryDate(refreshToken);

  await RefreshToken.create({
    user: superAdmin._id,
    userModel: "SuperAdmin",
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions(expiresAt));
  return accessToken;
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const superAdmin = await SuperAdmin.findOne({ email }).select("+password");
  if (!superAdmin || !(await superAdmin.comparePassword(password))) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid email or password");
  }

  if (!superAdmin.isActive) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Your super admin account has been deactivated");
  }

  superAdmin.lastLoginAt = new Date();
  await superAdmin.save();

  const accessToken = await issueSession(res, superAdmin);

  logActivity({
    actor: superAdmin._id,
    actorModel: "SuperAdmin",
    action: "LOGGED_IN",
    ipAddress: req.ip,
  }).catch(() => {});

  const safeSuperAdmin = superAdmin.toObject();
  delete safeSuperAdmin.password;

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, { superAdmin: safeSuperAdmin, accessToken }, "Login successful"));
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

  if (decoded.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Invalid token role");
  }

  const tokenHash = hashToken(token);
  const storedToken = await RefreshToken.findOne({ tokenHash, user: decoded.id });
  if (!storedToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Refresh token has been revoked");
  }

  const superAdmin = await SuperAdmin.findById(decoded.id);
  if (!superAdmin || !superAdmin.isActive) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Account is unavailable");
  }

  const accessToken = generateAccessToken({ id: superAdmin._id, role: ROLES.SUPER_ADMIN });

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

  const superAdmin = await SuperAdmin.findOne({ email });
  if (!superAdmin) {
    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, null, "If an account exists with this email, an OTP has been sent"));
  }

  const otp = generateOtp();
  const otpHash = hashToken(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.create({ email, userType: "superAdmin", otpHash, purpose: "password-reset", expiresAt });

  sendForgotPasswordEmail(superAdmin.email, superAdmin.name, otp).catch(() => {});

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, null, "If an account exists with this email, an OTP has been sent"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const otpRecord = await Otp.findOne({
    email,
    userType: "superAdmin",
    purpose: "password-reset",
    consumed: false,
  }).sort({ createdAt: -1 });

  if (!otpRecord || otpRecord.expiresAt < new Date() || otpRecord.otpHash !== hashToken(otp)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid or expired OTP");
  }

  const superAdmin = await SuperAdmin.findOne({ email });
  if (!superAdmin) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Account not found");
  }

  superAdmin.password = newPassword;
  await superAdmin.save();

  otpRecord.consumed = true;
  await otpRecord.save();

  await RefreshToken.deleteMany({ user: superAdmin._id });

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Password reset successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const superAdmin = await SuperAdmin.findById(req.superAdmin._id).select("+password");
  if (!(await superAdmin.comparePassword(oldPassword))) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Old password is incorrect");
  }

  superAdmin.password = newPassword;
  await superAdmin.save();

  const currentToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const currentHash = currentToken ? hashToken(currentToken) : null;
  await RefreshToken.deleteMany({ user: superAdmin._id, ...(currentHash && { tokenHash: { $ne: currentHash } }) });

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Password changed successfully"));
});
