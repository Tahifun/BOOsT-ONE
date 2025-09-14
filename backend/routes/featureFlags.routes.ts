// backend/routes/featureFlags.routes.ts
import { Router } from "express";

const router = Router();

// GET /api/feature-flags  â†’ vermeidet 404 im Frontend
router.get("/", (_req, res) => {
  res.status(200).json({ flags: {} });
});

export default router;


