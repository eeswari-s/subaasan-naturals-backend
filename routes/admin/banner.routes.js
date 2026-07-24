import { Router } from "express";
import * as adminBannerController from "../../controllers/admin/banner.controller.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import upload from "../../middlewares/upload.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { createBannerValidator, updateBannerValidator, bannerIdValidator } from "../../validators/banner.validator.js";

const router = Router();

router.use(adminMiddleware);

router.get("/", adminBannerController.getAdminBanners);
router.post("/", upload.single("image"), createBannerValidator, validateRequest, adminBannerController.createBanner);
router.put("/:id", upload.single("image"), updateBannerValidator, validateRequest, adminBannerController.updateBanner);
router.delete("/:id", bannerIdValidator, validateRequest, adminBannerController.deleteBanner);

export default router;
