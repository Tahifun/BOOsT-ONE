// backend/routes/admin.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdminOnly } from "../middleware/requireAdmin.js";
import { getMetrics } from "../controllers/adminController.js";

const router = Router();

// Auth MUSS vor Admin-Check laufen
router.get("/metrics", requireAuth, requireAdminOnly, getMetrics);

export default router;
