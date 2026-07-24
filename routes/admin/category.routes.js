import { Router } from "express";
import * as adminCategoryController from "../../controllers/admin/category.controller.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import upload from "../../middlewares/upload.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { createCategoryValidator, updateCategoryValidator, categoryIdValidator } from "../../validators/category.validator.js";

const router = Router();

router.use(adminMiddleware);

router.get("/", adminCategoryController.getAdminCategories);
router.post("/", upload.single("image"), createCategoryValidator, validateRequest, adminCategoryController.createCategory);
router.put("/:id", upload.single("image"), updateCategoryValidator, validateRequest, adminCategoryController.updateCategory);
router.delete("/:id", categoryIdValidator, validateRequest, adminCategoryController.deleteCategory);

export default router;
