import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log full error in dev console for debugging
  console.error("Error caught:", err);

  // 1. Invalid MongoDB ObjectId (CastError)
  if (err.name === "CastError") {
    const message = `Invalid resource ID: ${err.value}`;
    error = new AppError(message, 400);
  }

  // 2. Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const message = `Duplicate value for field '${field}'. Please use another value.`;
    error = new AppError(message, 400);
  }

  // 3. Mongoose Schema Validation Error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(", ");
    error = new AppError(message, 400);
  }

  // 4. Invalid JWT Token
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please log in again.", 401);
  }

  // 5. Expired JWT Token
  if (err.name === "TokenExpiredError") {
    error = new AppError("Your session has expired. Please log in again.", 401);
  }

  // Send formatted JSON response
  const statusCode = error.statusCode || 500;
  const responseMessage = error.isOperational
    ? error.message
    : "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    error: responseMessage,
  });
};