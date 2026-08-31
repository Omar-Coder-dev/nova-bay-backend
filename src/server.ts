import dotenv from "dotenv";
dotenv.config();
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

// Railway (and most cloud hosts) sit behind a reverse proxy and add
// an X-Forwarded-For header with the real client IP. Express doesn't
// trust that header by default, which made express-rate-limit throw
// and hang requests using authLimiter (forgot-password, login, etc).
// This tells Express to trust the first proxy hop, so rate limiting
// can correctly read the real client IP.
app.set("trust proxy", 1);

app.use(morgan('dev'));

// Webhook needs raw body for Stripe signature verification (BEFORE express.json)
app.use("/api/webhook", webhookRoutes);

app.use(
  cors({
    origin: process.env.CLIENT_URL?.replace(/\/$/, ""),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

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

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});