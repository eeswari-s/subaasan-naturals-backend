import { body, param } from "express-validator";

const isValidItemsJson = (value) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed) || parsed.length < 2) throw new Error();
    parsed.forEach((item) => {
      if (!item.product) throw new Error();
      if (!item.quantity || item.quantity < 1) throw new Error();
    });
  } catch {
    throw new Error("items must be a JSON array of at least 2 { product, variantName?, quantity } entries");
  }
  return true;
};

export const createComboValidator = [
  body("name").trim().notEmpty().withMessage("Combo name is required"),
  body("comboPrice").isFloat({ min: 0 }).withMessage("Combo price must be a positive number"),
  body("items").custom(isValidItemsJson),
  body("shortDescription").optional().isString(),
  body("description").optional().isString(),
  body("displayOrder").optional().isInt(),
  body("status").optional().isIn(["active", "inactive", "draft"]),
];

export const updateComboValidator = [
  param("id").isMongoId().withMessage("Invalid combo id"),
  body("comboPrice").optional().isFloat({ min: 0 }).withMessage("Combo price must be a positive number"),
  body("items").optional().custom(isValidItemsJson),
  body("status").optional().isIn(["active", "inactive", "draft"]),
];

export const comboIdValidator = [param("id").isMongoId().withMessage("Invalid combo id")];

export const comboSlugValidator = [param("slug").trim().notEmpty().withMessage("Slug is required")];
