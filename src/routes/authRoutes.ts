import { Router } from "express";
import { forgotPassword, getMe, googleLogin, login, logout, register, resetPassword } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/google", authLimiter, googleLogin);
router.post("/forgot-password", authLimiter, forgotPassword);
router.get("/me", protect, getMe);
router.post("/reset-password", authLimiter, resetPassword);

export default router;