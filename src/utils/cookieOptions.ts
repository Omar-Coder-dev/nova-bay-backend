import { CookieOptions } from "express";

const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT !== undefined;

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};