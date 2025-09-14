// routes/billing.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createPortalSession } from "../controllers/billingController.js";

const router = Router();

/** Billing-Portal */
router.post("/create-portal-session", requireAuth, createPortalSession);

export default router;
