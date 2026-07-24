import { Router } from "express";
import { query } from "express-validator";
import * as activityLogController from "../../controllers/superAdmin/activityLog.controller.js";
import superAdminMiddleware from "../../middlewares/superAdmin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";

const router = Router();

router.use(superAdminMiddleware);

const listValidator = [
  query("actor").optional().isMongoId(),
  query("actorModel").optional().isIn(["Admin", "SuperAdmin"]),
  query("startDate").optional().isISO8601(),
  query("endDate").optional().isISO8601(),
];

router.get("/", listValidator, validateRequest, activityLogController.getActivityLogs);

export default router;
