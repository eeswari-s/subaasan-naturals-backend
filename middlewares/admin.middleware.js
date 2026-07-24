import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/generateTokens.js";
import Admin from "../models/admin.model.js";
import { ROLES } from "../constants/roles.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";

const adminMiddleware = asyncHandler(async (req, res, next) => {
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

  if (decoded.role !== ROLES.ADMIN) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Access restricted to store admins");
  }

  const admin = await Admin.findById(decoded.id);
  if (!admin) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Admin account not found");
  }

  if (!admin.isActive) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Your admin account has been deactivated");
  }

  req.admin = admin;
  next();
});

export default adminMiddleware;
