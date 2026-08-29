import { Router } from "express";
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  upvoteReview,
  downvoteReview,
} from "../controllers/reviewController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/product/:productId", getProductReviews);

router.post("/", protect, createReview);
router.patch("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

router.patch("/:id/upvote", protect, upvoteReview);
router.patch("/:id/downvote", protect, downvoteReview);

export default router;