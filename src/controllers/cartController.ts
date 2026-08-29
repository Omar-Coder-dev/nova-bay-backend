import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart";
import Product from "../models/Product";

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    let cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price imageUrl stock isActive"
    );

    // A user might not have a cart document yet (never added anything) -
    // return an empty cart shape instead of a 404, since "empty cart" is
    // a normal state, not an error.
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    return res.status(200).json(cart);
  } catch (err) {
    next(err);
  }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { productId, quantity } = req.body;
    const parsedQuantity = Number(quantity);

    if (!mongoose.isValidObjectId(productId) || !parsedQuantity || parsedQuantity < 1) {
      return res.status(400).json({ message: "Valid productId and quantity (at least 1) are required" });
    }

    // 1. Verify product exists, is active, and has sufficient stock
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product unavailable" });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    const targetQuantity = existingItem 
      ? existingItem.quantity + parsedQuantity 
      : parsedQuantity;

    // 2. Prevent adding more items than available stock
    if (targetQuantity > product.stock) {
      return res.status(400).json({ 
        message: `Cannot add requested quantity. Only ${product.stock} items in stock.` 
      });
    }

    if (existingItem) {
      existingItem.quantity = targetQuantity;
    } else {
      cart.items.push({ product: productId, quantity: parsedQuantity });
    }

    await cart.save();
    const populatedCart = await cart.populate(
      "items.product",
      "name price imageUrl stock isActive"
    );

    return res.status(200).json(populatedCart);
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { productId } = req.params;
    const { quantity } = req.body;
    const parsedQuantity = Number(quantity);

    if (!parsedQuantity || parsedQuantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product unavailable" });
    }

    if (parsedQuantity > product.stock) {
      return res.status(400).json({
        message: `Cannot set quantity. Only ${product.stock} items in stock.`,
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find((item) => item.product.toString() === productId);

    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    item.quantity = parsedQuantity;
    await cart.save();

    const populatedCart = await cart.populate(
      "items.product",
      "name price imageUrl stock isActive"
    );

    return res.status(200).json(populatedCart);
  } catch (err) {
    next(err);
  }
};

export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { productId } = req.params;

    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { items: { product: productId } } },
      { new: true }
    ).populate("items.product", "name price imageUrl stock isActive");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    return res.status(200).json(cart);
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [] },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    return res.status(200).json(cart);
  } catch (err) {
    next(err);
  }
};