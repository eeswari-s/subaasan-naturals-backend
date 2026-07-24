import { body, param } from "express-validator";

export const updateCmsPageValidator = [
  param("slug").isIn(["privacy-policy", "terms-and-conditions", "contact-us"]).withMessage("Invalid CMS page slug"),
  body("title").optional().isString(),
  body("content").optional().isString(),
];

export const cmsSlugValidator = [
  param("slug").isIn(["privacy-policy", "terms-and-conditions", "contact-us"]).withMessage("Invalid CMS page slug"),
];
