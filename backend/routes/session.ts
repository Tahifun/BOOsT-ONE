import { Router } from "express";

const router = Router();

/**
 * GET /session
 * Gibt den aktuellen Login-Status zurück.
 * Liest primär aus der Session; wenn eine Upstream-Auth (z. B. Passport) bereits req.user setzt, wird die ebenfalls unterstützt.
 */
router.get("/session", (req, res) => {
  // 1) aus der Session lesen (Mock-Login schreibt hier rein)
  const sessionUser = (req as any).session?.user || null;
  // 2) alternativ aus req.user (falls vorhanden)
  const reqUser = (req as any).user || null;
  const user = sessionUser || reqUser;

  res.json({
    success: true,
    authenticated: Boolean(user),
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      : null,
  });
});

export default router;
