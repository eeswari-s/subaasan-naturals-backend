import { Router } from "express";
import * as superAdminAuthController from "../../controllers/auth/superAdminAuth.controller.js";
import superAdminMiddleware from "../../middlewares/superAdmin.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from "../../validators/auth.validator.js";

const router = Router();

router.post("/login", authRateLimiter, loginValidator, validateRequest, superAdminAuthController.login);
router.post("/refresh", superAdminAuthController.refresh);
router.post("/logout", superAdminAuthController.logout);
router.post("/forgot-password", authRateLimiter, forgotPasswordValidator, validateRequest, superAdminAuthController.forgotPassword);
router.post("/reset-password", authRateLimiter, resetPasswordValidator, validateRequest, superAdminAuthController.resetPassword);
router.post("/change-password", superAdminMiddleware, changePasswordValidator, validateRequest, superAdminAuthController.changePassword);

export default router;
