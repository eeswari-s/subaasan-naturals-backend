import { Router } from "express";
import { getAdminTransactions } from "../../controllers/admin/order.controller.js";
import superAdminMiddleware from "../../middlewares/superAdmin.middleware.js";

const router = Router();

router.use(superAdminMiddleware);

// Reuses the exact same handler as GET /admin/orders/transactions — same query logic,
// same pagination/filtering, just reachable under Super Admin auth too.
router.get("/", getAdminTransactions);

export default router;
