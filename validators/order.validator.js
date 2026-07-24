import { body, param } from "express-validator";
import { ORDER_STATUS_VALUES } from "../constants/orderStatus.js";
import { PAYMENT_METHOD_VALUES } from "../constants/paymentStatus.js";

export const createOrderValidator = [
  body("addressId").isMongoId().withMessage("A valid address id is required"),
  body("paymentMethod").isIn(PAYMENT_METHOD_VALUES).withMessage("Invalid payment method"),
];

export const verifyPaymentValidator = [
  body("razorpay_order_id").notEmpty().withMessage("razorpay_order_id is required"),
  body("razorpay_payment_id").notEmpty().withMessage("razorpay_payment_id is required"),
  body("razorpay_signature").notEmpty().withMessage("razorpay_signature is required"),
  body("orderId").isMongoId().withMessage("A valid internal order id is required"),
];

export const orderIdValidator = [param("id").isMongoId().withMessage("Invalid order id")];

export const updateOrderStatusValidator = [
  param("id").isMongoId().withMessage("Invalid order id"),
  body("status").isIn(ORDER_STATUS_VALUES).withMessage("Invalid order status"),
  body("note").optional().isString(),
];

export const updateTrackingValidator = [
  param("id").isMongoId().withMessage("Invalid order id"),
  body("carrier").optional().isString(),
  body("trackingNumber").optional().isString(),
  body("trackingUrl").optional().isString(),
];

export const returnRequestValidator = [
  param("id").isMongoId().withMessage("Invalid order id"),
  body("reason").trim().notEmpty().withMessage("Return reason is required"),
];

export const processReturnValidator = [
  param("id").isMongoId().withMessage("Invalid order id"),
  body("action").isIn(["approve", "reject"]).withMessage("Action must be approve or reject"),
];

export const processRefundValidator = [
  param("id").isMongoId().withMessage("Invalid order id"),
  body("amount").isFloat({ min: 0 }).withMessage("Refund amount must be a positive number"),
];
