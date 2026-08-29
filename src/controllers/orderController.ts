import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import Product from "../models/Product";
import stripe from "../config/stripe";
import { OrderStatus } from "../constants/enums";

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name price imageUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(id)
      .populate("user", "name email")
      .populate("items.product", "name price imageUrl");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to access this order" });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (req.query.status && Object.values(OrderStatus).includes(req.query.status as OrderStatus)) {
      filter.status = req.query.status;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate("items.product", "name price imageUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.pending]: [OrderStatus.paid, OrderStatus.cancelled],
  [OrderStatus.paid]: [OrderStatus.completed, OrderStatus.cancelled],
  [OrderStatus.completed]: [],
  [OrderStatus.cancelled]: [],
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const allowedNextStatuses = ALLOWED_TRANSITIONS[order.status];

    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from "${order.status}" to "${status}"`,
      });
    }

    order.status = status as OrderStatus;

    if (status === OrderStatus.completed) {
      order.deliveredAt = new Date();
    }

    await order.save();

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }

    if (order.status === OrderStatus.cancelled) {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    if (order.status === OrderStatus.completed) {
      return res.status(400).json({ message: "Cannot cancel a completed order" });
    }

    if (order.status === OrderStatus.paid && order.stripePaymentId) {
      await stripe.refunds.create({
        payment_intent: order.stripePaymentId,
      });
    }

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    order.status = OrderStatus.cancelled;
    await order.save();

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};