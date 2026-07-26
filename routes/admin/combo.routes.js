import { Router } from "express";
import * as adminComboController from "../../controllers/admin/combo.controller.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import upload from "../../middlewares/upload.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { createComboValidator, updateComboValidator, comboIdValidator } from "../../validators/combo.validator.js";

const router = Router();

router.use(adminMiddleware);

router.get("/", adminComboController.getAdminCombos);
router.get("/:id", comboIdValidator, validateRequest, adminComboController.getAdminComboById);
router.post("/", upload.single("thumbnail"), createComboValidator, validateRequest, adminComboController.createCombo);
router.put("/:id", upload.single("thumbnail"), updateComboValidator, validateRequest, adminComboController.updateCombo);
router.delete("/:id", comboIdValidator, validateRequest, adminComboController.deleteCombo);

export default router;
