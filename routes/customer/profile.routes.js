import { Router } from "express";
import * as profileController from "../../controllers/customer/profile.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/upload.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", profileController.getProfile);
router.put("/", upload.single("avatar"), profileController.updateProfile);

export default router;
