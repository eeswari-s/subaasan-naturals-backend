import { Router } from "express";
import * as adminReviewController from "../../controllers/admin/review.controller.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { reviewIdValidator } from "../../validators/review.validator.js";

const router = Router();

router.use(adminMiddleware);

router.get("/", adminReviewController.getAdminReviews);
router.patch("/:id/toggle-visibility", reviewIdValidator, validateRequest, adminReviewController.toggleReviewVisibility);
router.delete("/:id", reviewIdValidator, validateRequest, adminReviewController.deleteAdminReview);

export default router;
