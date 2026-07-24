import { Router } from "express";
import * as adminCustomerController from "../../controllers/admin/customer.controller.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { param } from "express-validator";

const router = Router();

router.use(adminMiddleware);

const idValidator = [param("id").isMongoId().withMessage("Invalid customer id"), validateRequest];

router.get("/", adminCustomerController.getAdminCustomers);
router.get("/:id", ...idValidator, adminCustomerController.getAdminCustomerById);
router.patch("/:id/block", ...idValidator, adminCustomerController.blockCustomer);
router.patch("/:id/unblock", ...idValidator, adminCustomerController.unblockCustomer);

export default router;
