// backend/routes/subscription.routes.ts
import { Router } from "express";
import { attachUserFromHeaders, requireAuth } from "../middleware/auth.js";
import {
  listPublicPlans,
  getMySubscription,
  cancelMySubscription,
  resumeMySubscription,
} from "../controllers/subscriptionController.js";

const router = Router();

// stellt req.user „weich“ bereit
router.use(attachUserFromHeaders as any);

// Öffentliche Pläne (aus ENV)
router.get("/plans", listPublicPlans);

// Eigener Abo-Status
router.get("/me", requireAuth, getMySubscription);

// Abo kündigen (am Periodenende)
router.post("/cancel", requireAuth, cancelMySubscription);

// Kündigung zurücknehmen
router.post("/resume", requireAuth, resumeMySubscription);

// (optional) falls Frontend ein „Ping“ erwartet:
router.get("/handshake", (_req, res) => res.json({ ok: true }));

export default router;
