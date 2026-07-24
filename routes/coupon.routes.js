import { Router } from "express";
import * as couponController from "../controllers/coupon.controller.js";

const router = Router();

router.get("/", couponController.getActiveCoupons);

export default router;
