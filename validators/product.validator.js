import { body, param, query } from "express-validator";

export const createProductValidator = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("category").isMongoId().withMessage("A valid category id is required"),
  body("mrp").isFloat({ min: 0 }).withMessage("MRP must be a positive number"),
  body("sellingPrice").isFloat({ min: 0 }).withMessage("Selling price must be a positive number"),
  body("offerPrice").optional().isFloat({ min: 0 }).withMessage("Offer price must be a positive number"),
  body("shortDescription").optional().isString(),
  body("fullDescription").optional().isString(),
  body("variants").optional().isArray().withMessage("Variants must be an array"),
  body("highlights").optional().isArray(),
];

export const updateProductValidator = [
  param("id").isMongoId().withMessage("Invalid product id"),
];

export const productIdValidator = [param("id").isMongoId().withMessage("Invalid product id")];

export const productSlugValidator = [param("slug").trim().notEmpty().withMessage("Slug is required")];

export const listProductsValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];
