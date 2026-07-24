import { Router } from "express";
import * as reportsController from "../../controllers/superAdmin/reports.controller.js";
import superAdminMiddleware from "../../middlewares/superAdmin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { exportReportValidator } from "../../validators/platformConfig.validator.js";

const router = Router();

router.use(superAdminMiddleware);

router.get("/export", exportReportValidator, validateRequest, reportsController.exportReport);

export default router;
