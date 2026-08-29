import Product from "../models/Product";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, price, category, stock, imageUrl } = req.body;

    if (
      !name ||
      !description ||
      price === undefined ||
      !category ||
      stock === undefined ||
      !imageUrl
    ) {
      return res.status(400).json({ message: "All product fields are required" });
    }

    const product = await Product.create({ name, description, price, category, stock, imageUrl });

    return res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

export const uploadProductImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "nova-bay/products" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file!.buffer);
    });

    return res.status(200).json({ imageUrl: uploadResult.secure_url });
  } catch (err) {
    next(err);
  }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, minPrice, maxPrice, inStock, search, sortBy, minRating, page = 1, limit = 12 } = req.query;

    const filter: any = { isActive: true };

    if (category) filter.category = category;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && !isNaN(Number(maxPrice))) filter.price.$lte = Number(maxPrice);
    }

    if (inStock === "true") filter.stock = { $gt: 0 };

    if (search) {
      const safeSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (minRating !== undefined && !isNaN(Number(minRating))) {
      filter.averageRating = { $gte: Number(minRating) };
    }

    let sortOption: any = { createdAt: -1 };
    if (sortBy === "price_asc") sortOption = { price: 1 };
    if (sortBy === "price_desc") sortOption = { price: -1 };
    if (sortBy === "rating") sortOption = { averageRating: -1 };

    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(limit) > 0 ? Number(limit) : 12;
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find(filter).skip(skip).limit(limitNumber).sort(sortOption);
    const total = await Product.countDocuments(filter);

    return res.status(200).json({
      products,
      currentPage: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      totalProducts: total,
    });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);

    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, isActive: true },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const deletedProduct = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (err) {
    next(err);
  }
};

export const getRelatedProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // First, find the product itself - we need to know its category
    const currentProduct = await Product.findById(id);

    if (!currentProduct || !currentProduct.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Now find other products in the same category, excluding this one
    const relatedProducts = await Product.find({
      category: currentProduct.category,
      _id: { $ne: id }, // $ne means "not equal" - excludes the current product
      isActive: true,
    }).limit(4);

    return res.status(200).json(relatedProducts);
  } catch (err) {
    next(err);
  }
};