import { Router } from "express";
import * as adminCouponController from "../../controllers/admin/coupon.controller.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { createCouponValidator, updateCouponValidator, couponIdValidator } from "../../validators/coupon.validator.js";

const router = Router();

router.use(adminMiddleware);

router.get("/", adminCouponController.getAdminCoupons);
router.post("/", createCouponValidator, validateRequest, adminCouponController.createCoupon);
router.put("/:id", updateCouponValidator, validateRequest, adminCouponController.updateCoupon);
router.delete("/:id", couponIdValidator, validateRequest, adminCouponController.deleteCoupon);

export default router;
