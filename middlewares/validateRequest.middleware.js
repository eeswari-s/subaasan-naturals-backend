import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";
import HTTP_STATUS from "../constants/httpStatusCodes.js";

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return next(new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, "Validation failed", formattedErrors));
  }

  next();
};

export default validateRequest;
