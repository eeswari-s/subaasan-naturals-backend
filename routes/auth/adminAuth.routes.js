import { Router } from "express";
import * as adminAuthController from "../../controllers/auth/adminAuth.controller.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from "../../validators/auth.validator.js";

const router = Router();

router.post("/login", authRateLimiter, loginValidator, validateRequest, adminAuthController.login);
router.post("/refresh", adminAuthController.refresh);
router.post("/logout", adminAuthController.logout);
router.post("/forgot-password", authRateLimiter, forgotPasswordValidator, validateRequest, adminAuthController.forgotPassword);
router.post("/reset-password", authRateLimiter, resetPasswordValidator, validateRequest, adminAuthController.resetPassword);
router.post("/change-password", adminMiddleware, changePasswordValidator, validateRequest, adminAuthController.changePassword);

export default router;
