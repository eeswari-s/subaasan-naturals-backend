import { body, param } from "express-validator";

export const createCouponValidator = [
  body("code").trim().notEmpty().withMessage("Coupon code is required"),
  body("type").isIn(["flat", "percentage"]).withMessage("Type must be flat or percentage"),
  body("value").isFloat({ min: 0 }).withMessage("Value must be a positive number"),
  body("minOrderValue").optional().isFloat({ min: 0 }),
  body("maxDiscount").optional({ nullable: true }).isFloat({ min: 0 }),
  body("usageLimit").optional({ nullable: true }).isInt({ min: 1 }),
  body("usageLimitPerUser").optional().isInt({ min: 1 }),
  body("startDate").isISO8601().withMessage("A valid start date is required"),
  body("endDate").isISO8601().withMessage("A valid end date is required"),
];

export const updateCouponValidator = [param("id").isMongoId().withMessage("Invalid coupon id")];

export const couponIdValidator = [param("id").isMongoId().withMessage("Invalid coupon id")];

export const applyCouponValidator = [
  body("code").trim().notEmpty().withMessage("Coupon code is required"),
];
