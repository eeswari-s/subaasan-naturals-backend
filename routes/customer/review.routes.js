import { Router } from "express";
import * as reviewController from "../../controllers/customer/review.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/upload.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { createReviewValidator, updateReviewValidator, reviewIdValidator } from "../../validators/review.validator.js";
import { param } from "express-validator";

const router = Router();

router.get(
  "/product/:productId",
  param("productId").isMongoId(),
  validateRequest,
  reviewController.getProductReviews
);

router.use(authMiddleware);

router.post("/", upload.array("images", 5), createReviewValidator, validateRequest, reviewController.createReview);
router.put("/:id", upload.array("images", 5), updateReviewValidator, validateRequest, reviewController.updateReview);
router.delete("/:id", reviewIdValidator, validateRequest, reviewController.deleteReview);

export default router;
