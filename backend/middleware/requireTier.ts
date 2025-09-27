// backend/middleware/requireTier.ts
// -> Vereinheitlicht Tiers (unterst�tzt 'free/pro/enterprise' und 'FREE/PRO/ENTERPRISE')
//    und nutzt die Auth-Types aus ./auth

import type { Response, NextFunction, RequestHandler } from "express";
import type { AuthenticatedRequest } from "./auth.js";

type TierLower = "free" | "pro" | "enterprise";
type TierUpper = "FREE" | "PRO" | "ENTERPRISE";
type AnyTier = TierLower | TierUpper;

const rank: Record<TierLower, number> = { free: 0, pro: 1, enterprise: 2 };

function norm(t?: AnyTier | null): TierLower | null {
  if (!t) return null;
  const s = String(t).toLowerCase() as TierLower;
  return s === "free" || s === "pro" || s === "enterprise" ? s : null;
}

/** Erlaubt NUR die angegebenen Tiers. */
export function requireTier(required: AnyTier | AnyTier[]): RequestHandler {
  const allowed = new Set(
    (Array.isArray(required) ? required : [required]).map((t) => norm(t)).filter(Boolean) as TierLower[]
  );

  return function (req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Admin/Superuser immer durchlassen
    if (req.user?.role?.toLowerCase() === "admin" || req.user?.role === "SUPERUSER") return next();

    const userTier = norm((req.user?.tier as any) ?? (req.user as any)?.subscriptionTier);
    if (!userTier) return res.status(403).json({ message: "Zugriff verweigert (kein Tier gesetzt)" });

    if (allowed.has(userTier)) return next();
    return res.status(403).json({ message: "Dieses Feature ist f�r dein Tier nicht freigeschaltet" });
  };
}

/** Erlaubt alle Nutzer ab dem angegebenen Mindest-Tier. */
export function requireMinTier(minTier: AnyTier): RequestHandler {
  const min = norm(minTier)!;
  const minRank = rank[min];

  return function (req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (req.user?.role?.toLowerCase() === "admin" || req.user?.role === "SUPERUSER") return next();

    const userTier = norm((req.user?.tier as any) ?? (req.user as any)?.subscriptionTier);
    if (!userTier) return res.status(403).json({ message: "Zugriff verweigert (kein Tier gesetzt)" });

    if (rank[userTier] >= minRank) return next();
    return res.status(403).json({ message: `Dieses Feature erfordert mindestens ${min}` });
  };
}


