import { Router } from "express";
import * as comboController from "../controllers/combo.controller.js";
import validateRequest from "../middlewares/validateRequest.middleware.js";
import { comboSlugValidator } from "../validators/combo.validator.js";

const router = Router();

router.get("/", comboController.getCombos);
router.get("/:slug", comboSlugValidator, validateRequest, comboController.getComboBySlug);

export default router;
