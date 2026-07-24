import { Router } from "express";
import * as dashboardController from "../../controllers/superAdmin/dashboard.controller.js";
import superAdminMiddleware from "../../middlewares/superAdmin.middleware.js";

const router = Router();

router.use(superAdminMiddleware);

router.get("/overview", dashboardController.getPlatformDashboard);
router.get("/report", dashboardController.generateReport);

export default router;
