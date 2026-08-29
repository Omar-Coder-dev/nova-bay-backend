import mongoose, { Document, Schema, Model } from "mongoose";
import Product from "./Product";

// Describes what a review looks like in our code.
export interface IReview extends Document {
  user: mongoose.Types.ObjectId; // who wrote the review
  product: mongoose.Types.ObjectId; // which product it's about
  rating: number;
  comment: string;
  upvotes: mongoose.Types.ObjectId[]; // list of user IDs who upvoted
  downvotes: mongoose.Types.ObjectId[]; // list of user IDs who downvoted
}

export interface IReviewModel extends Model<IReview> {
  calcAverageRating(productId: mongoose.Types.ObjectId | string): Promise<void>;
}

const reviewSchema = new Schema<IReview, IReviewModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"], // standard 1-5 star range
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
    },
    upvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    downvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Makes sure the SAME user can't review the SAME product more than once.
// It's the combination of both fields together that must be unique, not each one alone.
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

reviewSchema.statics.calcAverageRating = async function (
  productId: mongoose.Types.ObjectId | string
) {
  const stats = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId.toString()) } },
    {
      $group: {
        _id: "$product",
        numReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      numReviews: stats[0].numReviews,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      numReviews: 0,
    });
  }
};

const Review = mongoose.model<IReview, IReviewModel>("Review", reviewSchema);

export default Review;