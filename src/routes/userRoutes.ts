import { Router } from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateProfile,
} from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.patch("/profile", updateProfile);

router.get("/wishlist", getWishlist);
router.post("/wishlist/:productId", addToWishlist);
router.delete("/wishlist/:productId", removeFromWishlist);

export default router;