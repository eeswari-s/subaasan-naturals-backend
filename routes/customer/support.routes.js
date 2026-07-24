import { Router } from "express";
import * as supportController from "../../controllers/customer/support.controller.js";
import { cmsSlugValidator } from "../../validators/cms.validator.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";

const router = Router();

router.get("/contact", supportController.getContactInfo);
router.get("/pages/:slug", cmsSlugValidator, validateRequest, supportController.getCmsPage);

export default router;
