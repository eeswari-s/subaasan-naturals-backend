import { body, param } from "express-validator";

export const createAddressValidator = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("addressLine1").trim().notEmpty().withMessage("Address line 1 is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("state").trim().notEmpty().withMessage("State is required"),
  body("pincode").trim().notEmpty().withMessage("Pincode is required"),
  body("addressType").optional().isIn(["home", "work", "other"]),
  body("isDefault").optional().isBoolean(),
];

export const updateAddressValidator = [param("id").isMongoId().withMessage("Invalid address id")];

export const addressIdValidator = [param("id").isMongoId().withMessage("Invalid address id")];
