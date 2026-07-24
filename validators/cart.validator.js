import { body } from "express-validator";

export const addToCartValidator = [
  body("productId").isMongoId().withMessage("A valid product id is required"),
  body("variantName").optional({ nullable: true }).isString(),
  body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

export const updateCartItemValidator = [
  body("productId").isMongoId().withMessage("A valid product id is required"),
  body("variantName").optional({ nullable: true }).isString(),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

export const removeCartItemValidator = [
  body("productId").isMongoId().withMessage("A valid product id is required"),
  body("variantName").optional({ nullable: true }).isString(),
];

export const applyCartCouponValidator = [
  body("code").trim().notEmpty().withMessage("Coupon code is required"),
];
