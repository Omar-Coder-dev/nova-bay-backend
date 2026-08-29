import "dotenv/config";

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import connectDB from './config/db';
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import userRoutes from "./routes/userRoutes"
import cartRoutes from "./routes/cartRoutes"
import adminRoutes from "./routes/adminRoutes"
import { errorHandler } from "./middleware/errorMiddleware";

connectDB();

const app: Express = express();

// Morgan goes first so every request is logged, webhook included
app.use(morgan('dev'));

// Webhook needs raw body for Stripe signature verification (BEFORE express.json)
app.use("/api/webhook", webhookRoutes);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Resource Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('API is running...');
});

// GLOBAL ERROR HANDLER - Must be mounted AFTER all routes & BEFORE app.listen
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});