// backend/routes/dev.routes.ts
import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// In Produktion abschalten
if (process.env.NODE_ENV === "production") {
  router.all("*", (_req, res) => res.status(404).json({ ok: false, error: "Not available in production" }));
} else {
  /**
   * POST /api/dev/mint-token
   * Body (optional): { sub?: string, email?: string, tier?: "free"|"pro"|"enterprise" }
   * Antwort: { ok: true, token: "..." }
   */
  router.post("/dev/mint-token", (req, res) => {
    const JWT_SECRET = process.env.JWT_SECRET || "";
    if (!JWT_SECRET) return res.status(500).json({ ok: false, error: "JWT_SECRET not set" });

    const sub = (req.body?.sub as string) || crypto.randomBytes(12).toString("hex"); // gÃ¼ltige 24-hex ObjectId-Form
    const email = (req.body?.email as string) || "dev@example.com";
    const tier = (req.body?.tier as string) || "free";

    const payload: unknown = {
      sub,
      email,
      tier,
      iss: process.env.JWT_ISSUER || "app",
      aud: process.env.JWT_AUDIENCE || "app-clients"
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ ok: true, token, payload });
  });

  /**
   * GET /api/dev/whoami
   * Bearer-Token mitschicken â†’ gibt decoded user zurÃ¼ck
   */
  router.get("/dev/whoami", requireAuth, (req, res) => {
    return res.json({ ok: true, user: (req as any).user || null });
  });
}

export default router;


