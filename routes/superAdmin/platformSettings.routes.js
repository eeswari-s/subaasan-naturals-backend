import { Router } from "express";
import { body } from "express-validator";
import * as platformSettingsController from "../../controllers/superAdmin/platformSettings.controller.js";
import superAdminMiddleware from "../../middlewares/superAdmin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";

const router = Router();

router.use(superAdminMiddleware);

const updateValidator = [
  body("maintenanceMode").optional().isBoolean(),
  body("announcementActive").optional().isBoolean(),
  body("currency").optional().isString().isLength({ min: 3, max: 3 }).withMessage("currency should be a 3-letter code, e.g. INR"),
  body("timezone").optional().isString(),
  body("taxPercentage").optional({ nullable: true }).isFloat({ min: 0, max: 100 }).withMessage("taxPercentage must be between 0 and 100"),
  body("defaultDeliveryCharge").optional({ nullable: true }).isFloat({ min: 0 }).withMessage("defaultDeliveryCharge must be a positive number"),
];

router.get("/", platformSettingsController.getPlatformSettings);
router.put("/", updateValidator, validateRequest, platformSettingsController.updatePlatformSettings);

export default router;
