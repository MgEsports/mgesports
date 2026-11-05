import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  ign?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || "lordz-esports-ultra-secure-jwt-secret-key-2026-prod";

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  // Development bypass for demo-admin-token or offline fallback
  if (token === "demo-admin-token" && process.env.NODE_ENV !== "production") {
    req.user = {
      id: "4a8879b4-c0a4-40c4-bce6-181b496bec6f",
      email: "admin@lordz.gg",
      role: "ADMIN",
      ign: "LORDZ_OVERLORD",
    };
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const requireRole = (..._allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    // Only one role in admin portal: ADMIN (plus legacy admin values for backwards compatibility)
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "TOURNAMENT_ADMIN", "CONTENT_EDITOR"].includes(req.user.role);
    if (isAdmin) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: "Forbidden: Admin role required",
    });
  };
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  let token: string | undefined;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
    } catch {
      // ignore expired optional tokens
    }
  }
  next();
};
