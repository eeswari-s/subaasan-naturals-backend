import { body, query } from "express-validator";

export const updatePaymentConfigValidator = [
  body("razorpayKeyId").trim().notEmpty().withMessage("Razorpay Key ID is required"),
  body("razorpayKeySecret").trim().notEmpty().withMessage("Razorpay Key Secret is required"),
];

export const updateEmailConfigValidator = [
  body("brevoApiKey").optional({ checkFalsy: true }).isString(),
  body("senderEmail").optional({ checkFalsy: true }).isEmail().withMessage("A valid sender email is required"),
  body("senderName").optional({ checkFalsy: true }).isString(),
];

export const testEmailConfigValidator = [
  body("to").trim().isEmail().withMessage("A valid recipient email is required"),
];

export const exportReportValidator = [
  query("type").isIn(["revenue", "orders", "payments"]).withMessage("type must be revenue, orders, or payments"),
  query("format").isIn(["csv", "pdf"]).withMessage("format must be csv or pdf"),
  query("startDate").optional().isISO8601().withMessage("startDate must be a valid date"),
  query("endDate").optional().isISO8601().withMessage("endDate must be a valid date"),
];
