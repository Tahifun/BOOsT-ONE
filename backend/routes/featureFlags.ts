import { Router } from "express";

const router = Router();

// Frontend erwartet POST /api/feature-flags
// Wir liefern neutrale Defaults zur�ck.
router.post("/feature-flags", (req, res) => {
  res.json({
    success: true,
    flags: {
      // Passe hier sp�ter echte Flags an,
      // z.B. rollout-Prozente, AB-Tests etc.
      devProbe: true,
      billingEnabled: true,
      overlaysNewUI: false,
    },
  });
});

export default router;
