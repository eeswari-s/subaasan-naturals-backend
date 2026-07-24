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

// upload.any() instead of upload.fields([...]): the product form sends a dynamically
// indexed file field per variant (variantImages_0, variantImages_1, ...), so a static
// fields() list can never cover every possible variant count. Files are grouped by
// fieldname in the controller instead.
const productImageFields = upload.any();

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
