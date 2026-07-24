import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/generateTokens.js";
import SuperAdmin from "../models/superAdmin.model.js";
import { ROLES } from "../constants/roles.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";

const superAdminMiddleware = asyncHandler(async (req, res, next) => {
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

  if (decoded.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Access restricted to super admin");
  }

  const superAdmin = await SuperAdmin.findById(decoded.id);
  if (!superAdmin) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Super admin account not found");
  }

  if (!superAdmin.isActive) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "Your super admin account has been deactivated");
  }

  req.superAdmin = superAdmin;
  next();
});

export default superAdminMiddleware;
