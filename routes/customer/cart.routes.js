import { Router } from "express";
import * as cartController from "../../controllers/customer/cart.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import {
  addToCartValidator,
  updateCartItemValidator,
  removeCartItemValidator,
  applyCartCouponValidator,
} from "../../validators/cart.validator.js";

const router = Router();

router.use(authMiddleware);

router.get("/", cartController.getCart);
router.post("/items", addToCartValidator, validateRequest, cartController.addToCart);
router.put("/items", updateCartItemValidator, validateRequest, cartController.updateCartItem);
router.delete("/items", removeCartItemValidator, validateRequest, cartController.removeCartItem);
router.post("/coupon", applyCartCouponValidator, validateRequest, cartController.applyCoupon);
router.delete("/coupon", cartController.removeCoupon);

export default router;
