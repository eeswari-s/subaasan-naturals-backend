import { Router } from "express";
import * as dashboardController from "../../controllers/admin/dashboard.controller.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";

const router = Router();

router.use(adminMiddleware);

router.get("/overview", dashboardController.getDashboardOverview);
router.get("/revenue-graph", dashboardController.getRevenueGraph);
router.get("/notifications", dashboardController.getAdminNotifications);

export default router;
