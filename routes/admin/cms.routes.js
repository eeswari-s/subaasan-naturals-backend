import { Router } from "express";
import * as cmsController from "../../controllers/admin/cms.controller.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { updateCmsPageValidator } from "../../validators/cms.validator.js";

const router = Router();

router.use(adminMiddleware);

router.get("/", cmsController.getAdminCmsPages);
router.put("/:slug", updateCmsPageValidator, validateRequest, cmsController.upsertCmsPage);

export default router;
