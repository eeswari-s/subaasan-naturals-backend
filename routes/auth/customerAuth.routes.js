import { Router } from "express";
import * as customerAuthController from "../../controllers/auth/customerAuth.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from "../../validators/auth.validator.js";

const router = Router();

router.post("/register", authRateLimiter, registerValidator, validateRequest, customerAuthController.register);
router.post("/login", authRateLimiter, loginValidator, validateRequest, customerAuthController.login);
router.post("/refresh", customerAuthController.refresh);
router.post("/logout", customerAuthController.logout);
router.post("/forgot-password", authRateLimiter, forgotPasswordValidator, validateRequest, customerAuthController.forgotPassword);
router.post("/reset-password", authRateLimiter, resetPasswordValidator, validateRequest, customerAuthController.resetPassword);
router.post("/change-password", authMiddleware, changePasswordValidator, validateRequest, customerAuthController.changePassword);

export default router;
