import { Request, Response, NextFunction } from "express";
import Order from "../models/Order";
import Product from "../models/Product";
import User from "../models/User";
import { OrderStatus } from "../constants/enums";

/**
 * GET /api/admin/overview
 * The "at a glance" dashboard summary: total revenue, order counts by
 * status, and basic store size stats (total products, total users).
 */
export const getDashboardOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Run all four independent queries at the same time instead of one
    // after another - none of them depend on each other's results, so
    // waiting for them sequentially just wastes time.
    const [revenueResult, statusCounts, totalProducts, totalUsers] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $in: [OrderStatus.paid, OrderStatus.completed] } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Product.countDocuments({ isActive: true }),
      User.countDocuments(),
    ]);

    const revenue = revenueResult[0] || { totalRevenue: 0, totalOrders: 0 };

    const ordersByStatus: Record<string, number> = {
      pending: 0,
      paid: 0,
      completed: 0,
      cancelled: 0,
    };
    statusCounts.forEach((entry) => {
      ordersByStatus[entry._id] = entry.count;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue: revenue.totalRevenue,
        totalPaidOrders: revenue.totalOrders,
        ordersByStatus,
        totalProducts,
        totalUsers,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/revenue-by-category
 * Breaks down revenue per product category, sorted highest to lowest.
 */
export const getRevenueByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await Order.aggregate([
      { $match: { status: { $in: [OrderStatus.paid, OrderStatus.completed] } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          unitsSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/low-stock
 * Products running low on inventory. Supports filtering by category
 * and sorting, so a store with many categories can narrow this down.
 */
export const getLowStockProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { threshold = 5, category, sortBy = "stock_asc" } = req.query;

    const thresholdNumber = Number(threshold) > 0 ? Number(threshold) : 5;

    const filter: any = {
      isActive: true,
      stock: { $lt: thresholdNumber },
    };

    if (category) {
      filter.category = category;
    }

    let sortOption: any = { stock: 1 };
    if (sortBy === "stock_desc") sortOption = { stock: -1 };
    if (sortBy === "name") sortOption = { name: 1 };
    if (sortBy === "price_asc") sortOption = { price: 1 };
    if (sortBy === "price_desc") sortOption = { price: -1 };

    const products = await Product.find(filter).sort(sortOption);

    return res.status(200).json({
      success: true,
      threshold: thresholdNumber,
      count: products.length,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};