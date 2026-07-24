import { Router } from "express";
import * as storeSettingsController from "../../controllers/admin/storeSettings.controller.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import upload from "../../middlewares/upload.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { updateStoreSettingsValidator } from "../../validators/storeSettings.validator.js";

const router = Router();

router.use(adminMiddleware);

const logoFaviconFields = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "favicon", maxCount: 1 },
]);

router.get("/", storeSettingsController.getStoreSettings);
router.put("/", logoFaviconFields, updateStoreSettingsValidator, validateRequest, storeSettingsController.updateStoreSettings);

export default router;
