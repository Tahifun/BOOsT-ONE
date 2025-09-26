// backend/middleware/requireAdmin.ts
import type { Request, Response, NextFunction } from "express";
import { requireAuth } from "./auth.js";

type Role = "USER" | "ADMIN" | "SUPERUSER" | string;
type AuthenticatedRequest = Request & { user?: { role?: Role } };

/** Nur Admin/SUPERUSER durchlassen */
export function requireAdminOnly(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const role = req.user?.role;
  if (role === "ADMIN" || role === "SUPERUSER") return next();
  if (!req.user) return res.status(401).json({ ok: false, message: "unauthenticated" });
  return res.status(403).json({ ok: false, message: "admin_only" });
}

/** Komfort: erst Auth, dann Admin-Check */
const requireAdmin = [requireAuth, requireAdminOnly] as const;
export default requireAdmin;
