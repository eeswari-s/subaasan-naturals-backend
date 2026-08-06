import { Router } from "express";
import { getAnalyticsConfig } from "../controllers/analytics.controller.js";

const router = Router();

router.get("/analytics-config", getAnalyticsConfig);

export default router;
