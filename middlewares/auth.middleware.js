import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/generateTokens.js";
import User from "../models/user.model.js";
import { ROLES } from "../constants/roles.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authentication token is missing");
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid or expired access token");
  }

  if (decoded.role !== ROLES.CUSTOMER) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Access restricted to customers");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "User account not found");
  }

  if (user.isBlocked) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Your account has been blocked. Please contact support.");
  }

  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) return next();

  try {
    const decoded = verifyAccessToken(token);
    if (decoded.role === ROLES.CUSTOMER) {
      const user = await User.findById(decoded.id);
      if (user && !user.isBlocked) {
        req.user = user;
      }
    }
  } catch (error) {
    // ignore invalid/expired token for optional auth
  }

  next();
});

export default authMiddleware;
