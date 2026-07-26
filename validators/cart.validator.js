import { body } from "express-validator";

const requireProductOrCombo = (value, { req }) => {
  if (!req.body.productId && !req.body.comboId) {
    throw new Error("Either productId or comboId is required");
  }
  return true;
};

export const addToCartValidator = [
  body("productId").optional().isMongoId().withMessage("A valid product id is required"),
  body("comboId").optional().isMongoId().withMessage("A valid combo id is required"),
  body("productId").custom(requireProductOrCombo),
  body("variantName").optional({ nullable: true }).isString(),
  body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

export const updateCartItemValidator = [
  body("productId").optional().isMongoId().withMessage("A valid product id is required"),
  body("comboId").optional().isMongoId().withMessage("A valid combo id is required"),
  body("productId").custom(requireProductOrCombo),
  body("variantName").optional({ nullable: true }).isString(),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

export const removeCartItemValidator = [
  body("productId").optional().isMongoId().withMessage("A valid product id is required"),
  body("comboId").optional().isMongoId().withMessage("A valid combo id is required"),
  body("productId").custom(requireProductOrCombo),
  body("variantName").optional({ nullable: true }).isString(),
];

export const applyCartCouponValidator = [
  body("code").trim().notEmpty().withMessage("Coupon code is required"),
];
