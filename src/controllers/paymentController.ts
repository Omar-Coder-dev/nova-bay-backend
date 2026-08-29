import { Request, Response, NextFunction } from "express";
import Order from "../models/Order";
import Product from "../models/Product";
import Cart from "../models/Cart";
import stripe from "../config/stripe";

export const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    // Pull the cart from the DB instead of trusting a client-sent items array -
    // this is the actual link between "add to cart" and "checkout" that was missing.
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    const orderItems = [];
    const lineItems = [];
    let totalAmount = 0;
    const decrementedProducts: { productId: string; quantity: number }[] = [];

    for (const cartItem of cart.items) {
      const productId = cartItem.product.toString();
      const quantity = cartItem.quantity;

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: productId, isActive: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        // Roll back any stock we already reserved earlier in this loop
        for (const rollback of decrementedProducts) {
          await Product.findByIdAndUpdate(rollback.productId, {
            $inc: { stock: rollback.quantity },
          });
        }
        return res.status(400).json({
          message: `Product ${productId} is unavailable or doesn't have enough stock`,
        });
      }

      decrementedProducts.push({ productId, quantity });

      orderItems.push({
        product: updatedProduct._id,
        quantity,
        price: updatedProduct.price,
      });

      totalAmount += updatedProduct.price * quantity;

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: updatedProduct.name },
          unit_amount: Math.round(updatedProduct.price * 100),
        },
        quantity,
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      client_reference_id: order._id.toString(),
      success_url: "http://localhost:3000/order-success",
      cancel_url: "http://localhost:3000/cart",
    });

    order.stripeSessionId = session.id;
    await order.save();

    // Clear the cart now that its contents have been converted into an order.
    // The order itself is the permanent record from this point forward - the
    // cart's job (holding "what am I thinking about buying") is done.


    return res.status(200).json({ url: session.url });
  } catch (err) {
    next(err);
  }
};