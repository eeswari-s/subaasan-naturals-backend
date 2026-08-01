import { body } from "express-validator";

export const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phone").optional().isMobilePhone("any").withMessage("A valid phone number is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export const loginValidator = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

export const forgotPasswordValidator = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
];

export const resetPasswordValidator = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("otp").optional().isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
  body("token").optional().isString().notEmpty().withMessage("Invalid reset token"),
  body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body().custom((_, { req }) => {
    if (!req.body.otp && !req.body.token) {
      throw new Error("Either an OTP or a reset token is required");
    }
    return true;
  }),
];

export const changePasswordValidator = [
  body("oldPassword").notEmpty().withMessage("Old password is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];
