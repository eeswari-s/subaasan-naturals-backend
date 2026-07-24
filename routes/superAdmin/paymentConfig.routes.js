import { Router } from "express";
import * as paymentConfigController from "../../controllers/superAdmin/paymentConfig.controller.js";
import superAdminMiddleware from "../../middlewares/superAdmin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { updatePaymentConfigValidator } from "../../validators/platformConfig.validator.js";

const router = Router();

router.use(superAdminMiddleware);

router.get("/", paymentConfigController.getPaymentConfig);
router.put("/", updatePaymentConfigValidator, validateRequest, paymentConfigController.updatePaymentConfig);

export default router;
