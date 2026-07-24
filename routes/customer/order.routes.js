import { Router } from "express";
import * as orderController from "../../controllers/customer/order.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/upload.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { orderIdValidator, returnRequestValidator } from "../../validators/order.validator.js";

const router = Router();

router.use(authMiddleware);

router.get("/", orderController.getMyOrders);
router.get("/:id", orderIdValidator, validateRequest, orderController.getOrderById);
router.post("/:id/buy-again", orderIdValidator, validateRequest, orderController.buyAgain);
router.post(
  "/:id/return",
  upload.array("images", 5),
  returnRequestValidator,
  validateRequest,
  orderController.requestReturn
);
router.get("/:id/invoice", orderIdValidator, validateRequest, orderController.downloadInvoice);
router.post("/:id/invoice/email", orderIdValidator, validateRequest, orderController.emailInvoice);

export default router;
