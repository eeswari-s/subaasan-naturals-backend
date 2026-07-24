import { body, param } from "express-validator";

export const createCategoryValidator = [
  body("name").trim().notEmpty().withMessage("Category name is required"),
  body("parent").optional({ nullable: true }).isMongoId().withMessage("Invalid parent category id"),
  body("displayOrder").optional().isInt(),
];

export const updateCategoryValidator = [param("id").isMongoId().withMessage("Invalid category id")];

export const categoryIdValidator = [param("id").isMongoId().withMessage("Invalid category id")];
