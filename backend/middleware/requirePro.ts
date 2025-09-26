// backend/middleware/requirePro.ts
import type { RequestHandler } from "express";

const requirePro: RequestHandler = (req, res, next) => {
  if (req.user?.role === "SUPERUSER") return next();
  if ((req as any).subscription?.tier === "PRO") return next();

  return res.status(403).json({ message: "Pro required" });
};

export default requirePro;


