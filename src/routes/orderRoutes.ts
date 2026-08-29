import { Router } from "express";
import { createCheckoutSession } from "../controllers/paymentController";
import { protect, restrictTo } from "../middleware/authMiddleware";
import {
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/orderController";
import { UserRole } from "../constants/enums";

const router = Router();

// Protect all routes below
router.use(protect);

// Checkout route
router.post("/create-checkout-session", createCheckoutSession);

// User order history & management
router.get("/my-orders", getMyOrders);
router.get("/:id", getOrderById);
router.patch("/:id/cancel", cancelOrder);

// Admin-only order management
router.get("/", restrictTo(UserRole.admin), getAllOrders);
router.patch("/:id/status", restrictTo(UserRole.admin), updateOrderStatus);

export default router;