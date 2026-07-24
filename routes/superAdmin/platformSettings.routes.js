import { Router } from "express";
import * as platformSettingsController from "../../controllers/superAdmin/platformSettings.controller.js";
import superAdminMiddleware from "../../middlewares/superAdmin.middleware.js";

const router = Router();

router.use(superAdminMiddleware);

router.get("/", platformSettingsController.getPlatformSettings);
router.put("/", platformSettingsController.updatePlatformSettings);

export default router;
