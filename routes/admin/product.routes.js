import { Router } from "express";
import * as adminProductController from "../../controllers/admin/product.controller.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import upload from "../../middlewares/upload.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import {
  createProductValidator,
  updateProductValidator,
  productIdValidator,
} from "../../validators/product.validator.js";
import { body } from "express-validator";

const router = Router();

router.use(adminMiddleware);

const productImageFields = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "gallery", maxCount: 10 },
]);

router.get("/", adminProductController.getAdminProducts);
router.get("/:id", productIdValidator, validateRequest, adminProductController.getAdminProductById);
router.post("/", productImageFields, createProductValidator, validateRequest, adminProductController.createProduct);
router.put("/:id", productImageFields, updateProductValidator, validateRequest, adminProductController.updateProduct);
router.delete("/:id", productIdValidator, validateRequest, adminProductController.deleteProduct);
router.post(
  "/:id/variant-images",
  upload.array("images", 10),
  productIdValidator,
  body("variantName").notEmpty().withMessage("variantName is required"),
  validateRequest,
  adminProductController.uploadVariantImages
);

export default router;
