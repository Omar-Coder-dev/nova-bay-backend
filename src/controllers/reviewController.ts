import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Review from "../models/Review";

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: "Product ID, rating, and comment are required" });
    }

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating: Number(rating),
      comment,
    });

    await Review.calcAverageRating(productId);

    return res.status(201).json(review);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }
    next(err);
  }
};

export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Parse and sanitize query parameters for pagination
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const [reviews, totalReviews] = await Promise.all([
      Review.find({ product: productId })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ product: productId }),
    ]);

    return res.status(200).json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit),
      totalReviews,
    });
  } catch (err) {
    next(err);
  }
};

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this review" });
    }

    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment;

    await review.save();
    await Review.calcAverageRating(review.product);

    return res.status(200).json(review);
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    const productId = review.product;
    await review.deleteOne();
    await Review.calcAverageRating(productId);

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const upvoteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const userIdStr = req.user._id.toString();
    const isUpvoted = review.upvotes.some((u) => u.toString() === userIdStr);
    const isDownvoted = review.downvotes.some((u) => u.toString() === userIdStr);

    if (isUpvoted) {
      review.upvotes = review.upvotes.filter((u) => u.toString() !== userIdStr);
    } else {
      review.upvotes.push(req.user._id);
      if (isDownvoted) {
        review.downvotes = review.downvotes.filter((u) => u.toString() !== userIdStr);
      }
    }

    await review.save();
    return res.status(200).json(review);
  } catch (err) {
    next(err);
  }
};

export const downvoteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const userIdStr = req.user._id.toString();
    const isUpvoted = review.upvotes.some((u) => u.toString() === userIdStr);
    const isDownvoted = review.downvotes.some((u) => u.toString() === userIdStr);

    if (isDownvoted) {
      review.downvotes = review.downvotes.filter((u) => u.toString() !== userIdStr);
    } else {
      review.downvotes.push(req.user._id);
      if (isUpvoted) {
        review.upvotes = review.upvotes.filter((u) => u.toString() !== userIdStr);
      }
    }

    await review.save();
    return res.status(200).json(review);
  } catch (err) {
    next(err);
  }
};