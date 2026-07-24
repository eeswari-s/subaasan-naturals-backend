import multer from "multer";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";

export const notFoundHandler = (req, res, next) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `Route not found: ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const isMulterError = error instanceof multer.MulterError;
    const statusCode = isMulterError
      ? HTTP_STATUS.BAD_REQUEST
      : error.statusCode || (error.name === "ValidationError" ? HTTP_STATUS.UNPROCESSABLE_ENTITY : HTTP_STATUS.INTERNAL_SERVER_ERROR);
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  if (env.NODE_ENV === "development") {
    console.error(error);
  } else if (error.statusCode >= 500) {
    console.error(`[ERROR] ${error.message}`);
  }

  return res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(env.NODE_ENV === "development" && { stack: error.stack }),
  });
};
