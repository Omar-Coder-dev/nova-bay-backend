import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { IUser } from "../models/User";

// This tells TypeScript that Express's Request object can also carry
// a "user" property, which we attach ourselves once a token is verified.

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // 1. Look for "Authorization: Bearer <token>" in the request headers
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. No token at all -> reject immediately
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    // 3. Verify the token is real and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    // 4. Look up the user this token belongs to
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user no longer exists" });
    }

    // 5. Attach the user to the request so later handlers can use it
    req.user = user;

    // 6. Let the request continue
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    next();
  };
};