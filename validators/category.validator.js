import { body, param } from "express-validator";

export const createCategoryValidator = [
  body("name").trim().notEmpty().withMessage("Category name is required"),
  body("displayOrder").optional().isInt(),
];

export const updateCategoryValidator = [param("id").isMongoId().withMessage("Invalid category id")];

export const categoryIdValidator = [param("id").isMongoId().withMessage("Invalid category id")];
