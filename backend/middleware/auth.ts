// middleware/auth.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import env from "../utils/validateEnv.js";

export type Tier = "FREE" | "PRO";
export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email?: string;
    role?: "USER" | "ADMIN" | "SUPERUSER" | string;
    tier?: Tier;
  };
};

export const attachUserFromHeaders: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = (req.headers["authorization"] || "") as string;
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    if (token) {
      const payload = jwt.verify(token, env.JWT_SECRET) as any;
      let tier: Tier | undefined;
      const rawTier = (payload.tier ?? payload.subscriptionTier ?? payload.plan ?? payload?.user?.tier) as string | undefined;
      if (rawTier) {
        const up = String(rawTier).toUpperCase();
        if (up === "PRO" || up === "FREE") tier = up as Tier;
      }
      (req as AuthenticatedRequest).user = {
        id: String(payload.sub || payload.id || payload.userId || payload._id || ""),
        email: payload.email,
        role: payload.role || "USER",
        tier,
      };
    }
  } catch { /* ignore */ }
  return next();
};

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as AuthenticatedRequest).user?.id) {
    return res.status(401).json({ ok: false, error: "unauthenticated" });
  }
  return next();
};

export function requireTier(required: Tier): RequestHandler {
  const requiredUp = String(required).toUpperCase() as Tier;
  return (req: Request, res: Response, next: NextFunction) => {
    const userTier = (((req as AuthenticatedRequest).user?.tier || "FREE") as string).toUpperCase() as Tier;
    if (requiredUp === "PRO" && userTier !== "PRO") {
      return res.status(403).json({ ok: false, error: "pro_only" });
    }
    return next();
  };
}
