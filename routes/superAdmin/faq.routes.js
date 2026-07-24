import { Router } from "express";
import * as faqController from "../../controllers/superAdmin/faq.controller.js";
import superAdminMiddleware from "../../middlewares/superAdmin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { createFaqValidator, updateFaqValidator, faqIdValidator } from "../../validators/faq.validator.js";

const router = Router();

router.get("/", faqController.getPublicFaqs);

router.get("/admin/all", superAdminMiddleware, faqController.getAdminFaqs);
router.post("/admin", superAdminMiddleware, createFaqValidator, validateRequest, faqController.createFaq);
router.put("/admin/:id", superAdminMiddleware, updateFaqValidator, validateRequest, faqController.updateFaq);
router.delete("/admin/:id", superAdminMiddleware, faqIdValidator, validateRequest, faqController.deleteFaq);

export default router;
