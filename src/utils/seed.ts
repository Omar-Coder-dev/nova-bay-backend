import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';
import User from '../models/User';
import { ProductCategory, UserRole } from '../constants/enums';

dotenv.config();

const products = [
  { name: "Wireless Bluetooth Headphones", description: "Over-ear headphones with noise cancellation and 30-hour battery life.", price: 79.99, category: ProductCategory.electronics, stock: 25, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e" },
  { name: "Smartwatch Series 5", description: "Fitness tracking, heart rate monitor, and smartphone notifications.", price: 199.99, category: ProductCategory.electronics, stock: 15, imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30" },
  { name: "Portable Power Bank 20000mAh", description: "Fast-charging power bank with dual USB ports.", price: 34.99, category: ProductCategory.electronics, stock: 40, imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5" },
  { name: "Mechanical Keyboard RGB", description: "Tactile mechanical keyboard with customizable RGB lighting.", price: 89.99, category: ProductCategory.electronics, stock: 20, imageUrl: "https://images.unsplash.com/photo-1541140532154-b024d705b90a" },

  { name: "Men's Classic Denim Jacket", description: "Timeless denim jacket, regular fit, 100% cotton.", price: 59.99, category: ProductCategory.clothing, stock: 30, imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5" },
  { name: "Women's Running Leggings", description: "High-waisted, moisture-wicking leggings for workouts.", price: 34.99, category: ProductCategory.clothing, stock: 45, imageUrl: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8" },
  { name: "Unisex Cotton Hoodie", description: "Soft fleece-lined hoodie, available in multiple colors.", price: 44.99, category: ProductCategory.clothing, stock: 35, imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7" },

  { name: "Ceramic Non-Stick Cookware Set", description: "10-piece cookware set with ceramic non-stick coating.", price: 129.99, category: ProductCategory.home_and_kitchen, stock: 12, imageUrl: "https://images.unsplash.com/photo-1584990347449-a30f2b1e5e5f" },
  { name: "Electric Kettle 1.7L", description: "Fast-boil stainless steel electric kettle with auto shut-off.", price: 29.99, category: ProductCategory.home_and_kitchen, stock: 28, imageUrl: "https://images.unsplash.com/photo-1585515320310-259814833e62" },
  { name: "Memory Foam Pillow Set", description: "Set of 2 cervical support pillows for better sleep.", price: 39.99, category: ProductCategory.home_and_kitchen, stock: 22, imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2" },

  { name: "Vitamin C Serum", description: "Brightening facial serum with hyaluronic acid.", price: 24.99, category: ProductCategory.beauty, stock: 50, imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be" },
  { name: "Natural Bristle Hair Brush", description: "Detangling brush for smooth, frizz-free hair.", price: 14.99, category: ProductCategory.beauty, stock: 60, imageUrl: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da" },

  { name: "Yoga Mat with Carrying Strap", description: "Extra-thick non-slip yoga mat, eco-friendly material.", price: 27.99, category: ProductCategory.sports, stock: 33, imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f" },
  { name: "Adjustable Dumbbell Set", description: "5-25 lb adjustable dumbbells, space-saving design.", price: 149.99, category: ProductCategory.sports, stock: 10, imageUrl: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c" },

  { name: "The Midnight Library", description: "A bestselling novel about infinite possibilities and choices.", price: 16.99, category: ProductCategory.books, stock: 40, imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f" },
  { name: "Atomic Habits", description: "A guide to building good habits and breaking bad ones.", price: 18.99, category: ProductCategory.books, stock: 38, imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794" },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected to database for seeding...");

    // Wipe existing products so re-running this script doesn't create duplicates
    await Product.deleteMany({});
    console.log("Cleared existing products");

    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);

    // Create a demo admin account, only if one doesn't already exist -
    // register() always creates role: "user", so this is the only way
    // to get an admin account without manually editing the database.
    const existingAdmin = await User.findOne({ email: "admin@novabay.com" });

    if (!existingAdmin) {
      await User.create({
        name: "Admin",
        email: "admin@novabay.com",
        password: "Admin123!",
        role: UserRole.admin,
      });
      console.log("Created demo admin account: admin@novabay.com / Admin123!");
    } else {
      console.log("Admin account already exists, skipped");
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seedDatabase();