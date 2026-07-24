import { Router } from "express";

import customerAuthRoutes from "./auth/customerAuth.routes.js";
import adminAuthRoutes from "./auth/adminAuth.routes.js";
import superAdminAuthRoutes from "./auth/superAdminAuth.routes.js";

import profileRoutes from "./customer/profile.routes.js";
import addressRoutes from "./customer/address.routes.js";
import wishlistRoutes from "./customer/wishlist.routes.js";
import cartRoutes from "./customer/cart.routes.js";
import checkoutRoutes from "./customer/checkout.routes.js";
import orderRoutes from "./customer/order.routes.js";
import reviewRoutes from "./customer/review.routes.js";
import notificationRoutes from "./customer/notification.routes.js";
import supportRoutes from "./customer/support.routes.js";
import homeRoutes from "./customer/home.routes.js";

import productRoutes from "./product.routes.js";
import categoryRoutes from "./category.routes.js";
import bannerRoutes from "./banner.routes.js";
import couponRoutes from "./coupon.routes.js";
import paymentRoutes from "./payment.routes.js";

import adminDashboardRoutes from "./admin/dashboard.routes.js";
import adminProductRoutes from "./admin/product.routes.js";
import adminCategoryRoutes from "./admin/category.routes.js";
import adminBannerRoutes from "./admin/banner.routes.js";
import adminCouponRoutes from "./admin/coupon.routes.js";
import adminOrderRoutes from "./admin/order.routes.js";
import adminCustomerRoutes from "./admin/customer.routes.js";
import adminReviewRoutes from "./admin/review.routes.js";
import adminCmsRoutes from "./admin/cms.routes.js";
import adminStoreSettingsRoutes from "./admin/storeSettings.routes.js";

import superAdminDashboardRoutes from "./superAdmin/dashboard.routes.js";
import superAdminBlogRoutes from "./superAdmin/blog.routes.js";
import superAdminFaqRoutes from "./superAdmin/faq.routes.js";
import superAdminPlatformSettingsRoutes from "./superAdmin/platformSettings.routes.js";
import superAdminPaymentConfigRoutes from "./superAdmin/paymentConfig.routes.js";
import superAdminEmailConfigRoutes from "./superAdmin/emailConfig.routes.js";
import superAdminPaymentRoutes from "./superAdmin/payment.routes.js";
import superAdminReportsRoutes from "./superAdmin/reports.routes.js";
import superAdminProfileRoutes from "./superAdmin/profile.routes.js";
import superAdminActivityLogRoutes from "./superAdmin/activityLog.routes.js";

const router = Router();

// Auth
router.use("/auth/customer", customerAuthRoutes);
router.use("/auth/admin", adminAuthRoutes);
router.use("/auth/super-admin", superAdminAuthRoutes);

// Customer
router.use("/profile", profileRoutes);
router.use("/addresses", addressRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/cart", cartRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/notifications", notificationRoutes);
router.use("/support", supportRoutes);
router.use("/home", homeRoutes);

// Shared / public
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/banners", bannerRoutes);
router.use("/coupons", couponRoutes);
router.use("/payments", paymentRoutes);

// Admin
router.use("/admin/dashboard", adminDashboardRoutes);
router.use("/admin/products", adminProductRoutes);
router.use("/admin/categories", adminCategoryRoutes);
router.use("/admin/banners", adminBannerRoutes);
router.use("/admin/coupons", adminCouponRoutes);
router.use("/admin/orders", adminOrderRoutes);
router.use("/admin/customers", adminCustomerRoutes);
router.use("/admin/reviews", adminReviewRoutes);
router.use("/admin/cms", adminCmsRoutes);
router.use("/admin/store-settings", adminStoreSettingsRoutes);

// Super Admin
router.use("/super-admin/dashboard", superAdminDashboardRoutes);
router.use("/blogs", superAdminBlogRoutes);
router.use("/faqs", superAdminFaqRoutes);
router.use("/super-admin/platform-settings", superAdminPlatformSettingsRoutes);
router.use("/super-admin/payment-config", superAdminPaymentConfigRoutes);
router.use("/super-admin/email-config", superAdminEmailConfigRoutes);
router.use("/super-admin/payments", superAdminPaymentRoutes);
router.use("/super-admin/reports", superAdminReportsRoutes);
router.use("/super-admin/profile", superAdminProfileRoutes);
router.use("/super-admin/activity-logs", superAdminActivityLogRoutes);

export default router;
