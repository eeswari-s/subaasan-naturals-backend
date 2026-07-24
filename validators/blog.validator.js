import { body, param } from "express-validator";

export const createBlogValidator = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("content").trim().notEmpty().withMessage("Content is required"),
  body("category").optional().isString(),
  body("shortDescription").optional().isString(),
  body("status").optional().isIn(["draft", "published"]),
];

export const updateBlogValidator = [param("id").isMongoId().withMessage("Invalid blog id")];

export const blogIdValidator = [param("id").isMongoId().withMessage("Invalid blog id")];
