import { Router } from "express";
import {
  getDashboardOverview,
  getRevenueByCategory,
  getLowStockProducts,
} from "../controllers/adminController";
import { protect, restrictTo } from "../middleware/authMiddleware";
import { UserRole } from "../constants/enums";

const router = Router();

// Every route in this file is admin-only, no exceptions -
// this is store-wide revenue and business data, never for regular users.
router.use(protect, restrictTo(UserRole.admin));

router.get("/overview", getDashboardOverview);
router.get("/revenue-by-category", getRevenueByCategory);
router.get("/low-stock", getLowStockProducts);

export default router;