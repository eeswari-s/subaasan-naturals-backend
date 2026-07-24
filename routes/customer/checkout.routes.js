import { Router } from "express";
import * as checkoutController from "../../controllers/customer/checkout.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { createOrderValidator } from "../../validators/order.validator.js";

const router = Router();

router.use(authMiddleware);

router.get("/preview", checkoutController.previewCheckout);
router.post("/", createOrderValidator, validateRequest, checkoutController.createOrder);

export default router;
