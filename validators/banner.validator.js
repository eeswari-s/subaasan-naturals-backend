import { body, param } from "express-validator";

export const createBannerValidator = [
  body("title").trim().notEmpty().withMessage("Banner title is required"),
  body("subtitle").optional().isString(),
  body("linkedProduct").optional({ nullable: true }).isMongoId().withMessage("Invalid linked product id"),
  body("displayOrder").optional().isInt(),
  body("status").optional().isIn(["active", "inactive"]),
];

export const updateBannerValidator = [param("id").isMongoId().withMessage("Invalid banner id")];

export const bannerIdValidator = [param("id").isMongoId().withMessage("Invalid banner id")];
