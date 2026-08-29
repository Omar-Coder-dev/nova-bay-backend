import { CookieOptions } from "express";

const isProduction = process.env.NODE_ENV === "production";

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction, // HTTPS-only in production, plain HTTP allowed in dev
  sameSite: isProduction ? "none" : "lax", // cross-domain needs "none", localhost works with "lax"
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};