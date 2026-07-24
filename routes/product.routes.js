import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import authMiddleware, { optionalAuth } from "../middlewares/auth.middleware.js";
import validateRequest from "../middlewares/validateRequest.middleware.js";
import { listProductsValidator, productSlugValidator } from "../validators/product.validator.js";

const router = Router();

router.get("/", listProductsValidator, validateRequest, productController.getProducts);
router.get("/recently-viewed", authMiddleware, productController.getRecentlyViewedProducts);
router.get("/:slug", productSlugValidator, validateRequest, optionalAuth, productController.getProductBySlug);

export default router;
