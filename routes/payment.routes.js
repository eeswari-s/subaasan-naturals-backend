import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import validateRequest from "../middlewares/validateRequest.middleware.js";
import { paymentRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { verifyPaymentValidator } from "../validators/order.validator.js";
import { body } from "express-validator";

const router = Router();

router.use(authMiddleware);

router.post(
  "/create-order",
  paymentRateLimiter,
  body("orderId").isMongoId().withMessage("A valid order id is required"),
  validateRequest,
  paymentController.createPaymentOrder
);
router.post("/verify", paymentRateLimiter, verifyPaymentValidator, validateRequest, paymentController.verifyPayment);
router.get("/transactions", paymentController.getMyTransactions);

export default router;
