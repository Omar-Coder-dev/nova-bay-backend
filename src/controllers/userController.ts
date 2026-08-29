import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import User from "../models/User";

export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.user._id).populate(
      "wishlist",
      "name price imageUrl averageRating stock"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user.wishlist);
  } catch (err) {
    next(err);
  }
};

export const addToWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { wishlist: productId } },
      { new: true }
    ).populate("wishlist", "name price imageUrl averageRating stock");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user.wishlist);
  } catch (err) {
    next(err);
  }
};

export const removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { wishlist: productId } },
      { new: true }
    ).populate("wishlist", "name price imageUrl averageRating stock");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user.wishlist);
  } catch (err) {
    next(err);
  }
};

// Fields a user is allowed to self-edit. Deliberately narrow -
// NOT using req.body directly, since that would let someone try to
// sneak in role, email, password, etc. through this endpoint.
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { name, address } = req.body;

    const updates: Record<string, string> = {};
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update" });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
    });
  } catch (err) {
    next(err);
  }
};