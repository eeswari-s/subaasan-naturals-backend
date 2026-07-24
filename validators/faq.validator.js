import { body, param } from "express-validator";

export const createFaqValidator = [
  body("question").trim().notEmpty().withMessage("Question is required"),
  body("answer").trim().notEmpty().withMessage("Answer is required"),
  body("category").optional().isString(),
  body("displayOrder").optional().isInt(),
];

export const updateFaqValidator = [param("id").isMongoId().withMessage("Invalid FAQ id")];

export const faqIdValidator = [param("id").isMongoId().withMessage("Invalid FAQ id")];
