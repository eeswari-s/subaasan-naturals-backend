import { body, param } from "express-validator";

export const createReviewValidator = [
  body("productId").isMongoId().withMessage("A valid product id is required"),
  body("orderId").isMongoId().withMessage("A valid order id is required"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("reviewText").optional().isString(),
];

export const updateReviewValidator = [
  param("id").isMongoId().withMessage("Invalid review id"),
  body("rating").optional().isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("reviewText").optional().isString(),
];

export const reviewIdValidator = [param("id").isMongoId().withMessage("Invalid review id")];
