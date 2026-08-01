import crypto from "crypto";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import HTTP_STATUS from "../../constants/httpStatusCodes.js";
import { ROLES } from "../../constants/roles.js";
import User from "../../models/user.model.js";
import Otp from "../../models/otp.model.js";
import RefreshToken from "../../models/refreshToken.model.js";
import generateOtp from "../../utils/generateOtp.js";
import { generateTokens, generateAccessToken, hashToken, getTokenExpiryDate, verifyRefreshToken } from "../../utils/generateTokens.js";
import { sendOtpEmail, sendForgotPasswordEmail, sendWelcomeEmail } from "../../services/email.service.js";
import env from "../../config/env.js";

const REFRESH_COOKIE_NAME = "refreshToken";
const OTP_EXPIRY_MINUTES = 10;

const cookieOptions = (expiresAt) => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  expires: expiresAt,
});

const issueSession = async (res, user) => {
  const { accessToken, refreshToken } = generateTokens({ id: user._id, role: ROLES.CUSTOMER });
  const expiresAt = getTokenExpiryDate(refreshToken);

  await RefreshToken.create({
    user: user._id,
    userModel: "User",
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions(expiresAt));
  return accessToken;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "An account with this email already exists");
  }

  const user = await User.create({ name, email, phone, password });

  const accessToken = await issueSession(res, user);

  sendWelcomeEmail(user.email, user.name, env.CLIENT_URL).catch(() => {});

  return res
    .status(HTTP_STATUS.CREATED)
    .json(new ApiResponse(HTTP_STATUS.CREATED, { user: user.toSafeObject(), accessToken }, "Registration successful"));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid email or password");
  }

  if (user.isBlocked) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Your account has been blocked. Please contact support.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = await issueSession(res, user);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, { user: user.toSafeObject(), accessToken }, "Login successful"));
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

  if (decoded.role !== ROLES.CUSTOMER) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Invalid token role");
  }

  const tokenHash = hashToken(token);
  const storedToken = await RefreshToken.findOne({ tokenHash, user: decoded.id });
  if (!storedToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Refresh token has been revoked");
  }

  const user = await User.findById(decoded.id);
  if (!user || user.isBlocked) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Account is unavailable");
  }

  const accessToken = generateAccessToken({ id: user._id, role: ROLES.CUSTOMER });

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

  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, null, "If an account exists with this email, a password reset link has been sent"));
  }

  const otp = generateOtp();
  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.create({
    email,
    userType: "customer",
    otpHash: hashToken(otp),
    resetTokenHash: hashToken(resetToken),
    purpose: "password-reset",
    expiresAt,
  });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  sendForgotPasswordEmail(user.email, user.name, otp, resetUrl).catch(() => {});

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, null, "If an account exists with this email, a password reset link has been sent"));
});

export const verifyResetToken = asyncHandler(async (req, res) => {
  const { email, token } = req.query;

  const otpRecord = email
    ? await Otp.findOne({
        email,
        userType: "customer",
        purpose: "password-reset",
        consumed: false,
      }).sort({ createdAt: -1 })
    : null;

  const isValid = Boolean(
    otpRecord && token && otpRecord.expiresAt >= new Date() && otpRecord.resetTokenHash === hashToken(token)
  );

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { valid: isValid }));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, token, newPassword } = req.body;

  const otpRecord = await Otp.findOne({
    email,
    userType: "customer",
    purpose: "password-reset",
    consumed: false,
  }).sort({ createdAt: -1 });

  const isValid =
    otpRecord &&
    otpRecord.expiresAt >= new Date() &&
    ((token && otpRecord.resetTokenHash === hashToken(token)) || (otp && otpRecord.otpHash === hashToken(otp)));

  if (!isValid) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid or expired reset link/OTP");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Account not found");
  }

  user.password = newPassword;
  await user.save();

  otpRecord.consumed = true;
  await otpRecord.save();

  await RefreshToken.deleteMany({ user: user._id });

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Password reset successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(oldPassword))) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  const currentToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const currentHash = currentToken ? hashToken(currentToken) : null;
  await RefreshToken.deleteMany({ user: user._id, ...(currentHash && { tokenHash: { $ne: currentHash } }) });

  return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, "Password changed successfully"));
});
