import { CookieOptions } from "express";

export const cookieOptions: CookieOptions = {
  httpOnly: true, // JS on the frontend can never read this cookie - blocks XSS token theft
  secure: true, // only sent over HTTPS - required for sameSite: "none"
  sameSite: "none", // required since Railway (backend) and Vercel (frontend) are different domains
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days - keep this in sync with JWT_EXPIRES_IN
  path: "/",
};