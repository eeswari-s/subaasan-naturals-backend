import { Router } from "express";
import * as profileController from "../../controllers/superAdmin/profile.controller.js";
import superAdminMiddleware from "../../middlewares/superAdmin.middleware.js";
import upload from "../../middlewares/upload.middleware.js";

const router = Router();

router.use(superAdminMiddleware);

router.get("/", profileController.getProfile);
router.put("/", upload.single("avatar"), profileController.updateProfile);

export default router;
