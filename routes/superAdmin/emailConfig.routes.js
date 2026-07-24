import { Router } from "express";
import * as emailConfigController from "../../controllers/superAdmin/emailConfig.controller.js";
import superAdminMiddleware from "../../middlewares/superAdmin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { updateEmailConfigValidator, testEmailConfigValidator } from "../../validators/platformConfig.validator.js";
import { otpRateLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = Router();

router.use(superAdminMiddleware);

router.get("/", emailConfigController.getEmailConfig);
router.put("/", updateEmailConfigValidator, validateRequest, emailConfigController.updateEmailConfig);
router.post("/test", otpRateLimiter, testEmailConfigValidator, validateRequest, emailConfigController.testEmailConfig);

export default router;
