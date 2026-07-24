import { body, param, query } from "express-validator";

// The product form is multipart/form-data, so array/object fields (variants,
// highlights, relatedProducts, existingGalleryUrls) arrive as JSON strings, not real
// arrays — this just checks they parse to an array, the controller does the real parse.
const isJsonArrayString = (value) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) throw new Error();
  } catch {
    throw new Error("must be a valid JSON array");
  }
  return true;
};

export const createProductValidator = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("categoryId").isMongoId().withMessage("A valid category id is required"),
  body("mrp").isFloat({ min: 0 }).withMessage("MRP must be a positive number"),
  body("sellingPrice").isFloat({ min: 0 }).withMessage("Selling price must be a positive number"),
  body("offerPrice").optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage("Offer price must be a positive number"),
  body("shortDescription").optional().isString(),
  body("fullDescription").optional().isString(),
  body("variants").optional({ checkFalsy: true }).custom(isJsonArrayString),
  body("highlights").optional({ checkFalsy: true }).custom(isJsonArrayString),
  body("relatedProducts").optional({ checkFalsy: true }).custom(isJsonArrayString),
];

export const updateProductValidator = [
  param("id").isMongoId().withMessage("Invalid product id"),
  body("categoryId").optional().isMongoId().withMessage("A valid category id is required"),
  body("mrp").optional().isFloat({ min: 0 }).withMessage("MRP must be a positive number"),
  body("sellingPrice").optional().isFloat({ min: 0 }).withMessage("Selling price must be a positive number"),
  body("offerPrice").optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage("Offer price must be a positive number"),
  body("variants").optional({ checkFalsy: true }).custom(isJsonArrayString),
  body("highlights").optional({ checkFalsy: true }).custom(isJsonArrayString),
  body("relatedProducts").optional({ checkFalsy: true }).custom(isJsonArrayString),
];

export const productIdValidator = [param("id").isMongoId().withMessage("Invalid product id")];

export const productSlugValidator = [param("slug").trim().notEmpty().withMessage("Slug is required")];

export const listProductsValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];
