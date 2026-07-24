import { Router } from "express";
import * as blogController from "../../controllers/superAdmin/blog.controller.js";
import superAdminMiddleware from "../../middlewares/superAdmin.middleware.js";
import upload from "../../middlewares/upload.middleware.js";
import validateRequest from "../../middlewares/validateRequest.middleware.js";
import { createBlogValidator, updateBlogValidator, blogIdValidator } from "../../validators/blog.validator.js";

const router = Router();

// Public storefront reads
router.get("/", blogController.getPublicBlogs);
router.get("/:slug", blogController.getPublicBlogBySlug);

// Super admin management
router.get("/admin/all", superAdminMiddleware, blogController.getAdminBlogs);
router.post(
  "/admin",
  superAdminMiddleware,
  upload.single("thumbnail"),
  createBlogValidator,
  validateRequest,
  blogController.createBlog
);
router.put(
  "/admin/:id",
  superAdminMiddleware,
  upload.single("thumbnail"),
  updateBlogValidator,
  validateRequest,
  blogController.updateBlog
);
router.delete("/admin/:id", superAdminMiddleware, blogIdValidator, validateRequest, blogController.deleteBlog);

export default router;
