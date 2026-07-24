import { Router } from "express";
import * as notificationController from "../../controllers/customer/notification.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { param } from "express-validator";

const router = Router();

router.use(authMiddleware);

router.get("/", notificationController.getMyNotifications);
router.patch("/read-all", notificationController.markAllNotificationsRead);
router.patch("/:id/read", param("id").isMongoId(), validateRequest, notificationController.markNotificationRead);

export default router;
