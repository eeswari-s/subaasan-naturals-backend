import { Router } from "express";
import * as adminOrderController from "../../controllers/admin/order.controller.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import {
  orderIdValidator,
  updateOrderStatusValidator,
  updateTrackingValidator,
  processReturnValidator,
  processRefundValidator,
} from "../../validators/order.validator.js";

const router = Router();

router.use(adminMiddleware);

router.get("/", adminOrderController.getAdminOrders);
router.get("/transactions", adminOrderController.getAdminTransactions);
router.get("/returns", adminOrderController.getReturnRequests);
router.get("/:id", orderIdValidator, validateRequest, adminOrderController.getAdminOrderById);
router.patch("/:id/status", updateOrderStatusValidator, validateRequest, adminOrderController.updateOrderStatus);
router.patch("/:id/tracking", updateTrackingValidator, validateRequest, adminOrderController.updateTracking);
router.get("/:id/invoice", orderIdValidator, validateRequest, adminOrderController.downloadOrderInvoice);
router.patch("/:id/return", processReturnValidator, validateRequest, adminOrderController.processReturnRequest);
router.post("/:id/refund", processRefundValidator, validateRequest, adminOrderController.processRefund);

export default router;
