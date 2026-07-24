import { Router } from "express";
import * as wishlistController from "../../controllers/customer/wishlist.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { body, param } from "express-validator";
import validateRequest from "../../middlewares/validateRequest.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", wishlistController.getWishlist);
router.post(
  "/",
  body("productId").isMongoId().withMessage("A valid product id is required"),
  validateRequest,
  wishlistController.addToWishlist
);
router.delete(
  "/:productId",
  param("productId").isMongoId().withMessage("A valid product id is required"),
  validateRequest,
  wishlistController.removeFromWishlist
);

export default router;
