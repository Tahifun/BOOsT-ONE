import { Router } from "express";

const router = Router();

// Frontend erwartet POST /api/feature-flags
// Wir liefern neutrale Defaults zurck.
router.post("/feature-flags", (req, res) => {
  res.json({
    success: true,
    flags: {
      // Passe hier spter echte Flags an,
      // z.B. rollout-Prozente, AB-Tests etc.
      devProbe: true,
      billingEnabled: true,
      overlaysNewUI: false,
    },
  });
});

export default router;
