import { Router } from "express";
import * as addressController from "../../controllers/customer/address.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { createAddressValidator, updateAddressValidator, addressIdValidator } from "../../validators/address.validator.js";

const router = Router();

router.use(authMiddleware);

router.get("/", addressController.listAddresses);
router.post("/", createAddressValidator, validateRequest, addressController.createAddress);
router.put("/:id", updateAddressValidator, validateRequest, addressController.updateAddress);
router.delete("/:id", addressIdValidator, validateRequest, addressController.deleteAddress);
router.patch("/:id/default", addressIdValidator, validateRequest, addressController.setDefaultAddress);

export default router;
