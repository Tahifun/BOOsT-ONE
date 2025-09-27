// backend/routes/subscriptionStatus.routes.ts
import { Router, Request, Response, NextFunction } from "express";

const router = Router();

/**
 * Liest komfortabel Session & User.
 */
function getSession(req: Request): unknown {
  return (req as any).session || {};
}
function getUser(req: Request): unknown {
  const sUser = getSession(req).user || null;
  const rUser = (req as any).user || null;
  return sUser || rUser;
}

/**
 * GET /api/subscription/status/
 * - Ohne Login & ohne Simulation: FREE, authenticated:false
 * - Mit Login & ohne Simulation:  FREE, authenticated:true
 * - Mit Simulation (in Session gemerkt): plan aus Session + authenticated:true
 */
router.get("/", (req: Request, res: Response) => {
  const session = getSession(req);
  const user = getUser(req);

  // 1) Wenn Simulation gesetzt wurde, gilt die immer
  const simPlan = (session.simPlan as string | undefined)?.toUpperCase();

  if (simPlan) {
    const plan = ["PRO", "DAYPASS", "FREE"].includes(simPlan) ? simPlan : "PRO";
    return res.json({
      success: true,
      authenticated: true,
      plan,
      isPro: plan === "PRO",
      isDayPass: plan === "DAYPASS",
      expiresAt: null,
    });
  }

  // 2) Keine Simulation ? normales Verhalten
  if (!user) {
    return res.json({
      success: true,
      authenticated: false,
      plan: "FREE",
      isPro: false,
      isDayPass: false,
      expiresAt: null,
    });
  }

  return res.json({
    success: true,
    authenticated: true,
    plan: "FREE",
    isPro: false,
    isDayPass: false,
    expiresAt: null,
  });
});

/**
 * ?? Simulation setzen (nur in Dev nutzbar):
 * GET /api/subscription/status/simulate?plan=PRO|DAYPASS|FREE
 * - Merkt den gew�nschten Plan in der Session (session.simPlan)
 * - Falls noch kein User existiert, wird ein einfacher Mock-User gesetzt,
 *   damit authenticated:true ist.
 */
router.get("/simulate", (req: Request, res: Response, next: NextFunction) => {
  const isProd = (process.env.NODE_ENV || "development") === "production";
  if (isProd) {
    return res.status(403).json({ success: false, error: "forbidden_in_production" });
  }

  const raw = String(req.query.plan || "PRO").toUpperCase();
  const plan = (["PRO", "DAYPASS", "FREE"].includes(raw) ? raw : "PRO") as
    | "PRO"
    | "DAYPASS"
    | "FREE";

  const session = getSession(req);

  // in der Session merken
  session.simPlan = plan;

  // Wenn noch kein User vorhanden ist, einen leichten Mock-User setzen,
  // damit authenticated:true gilt.
  if (!session.user) {
    session.user = { id: "sim-user", email: "sim@clipboost.local", name: "Simulator" };
  }

  // Session speichern und antworten
  req.session.save((err) => {
    if (err) return next(err);
    return res.json({
      success: true,
      authenticated: true,
      plan,
      isPro: plan === "PRO",
      isDayPass: plan === "DAYPASS",
      expiresAt: null,
    });
  });
});

/**
 * ?? Simulation zur�cksetzen:
 * GET /api/subscription/status/simulate/clear
 * - Entfernt simPlan aus der Session (du bist danach wieder FREE gem�� Normal-Logik)
 */
router.get("/simulate/clear", (req: Request, res: Response, next: NextFunction) => {
  const isProd = (process.env.NODE_ENV || "development") === "production";
  if (isProd) {
    return res.status(403).json({ success: false, error: "forbidden_in_production" });
  }

  const session = getSession(req);
  delete session.simPlan;

  req.session.save((err) => {
    if (err) return next(err);
    return res.json({ success: true, cleared: true });
  });
});

// Optional: gleiche Antwort auch ohne trailing slash
router.get("", (req: Request, res: Response, next: NextFunction) => {
  (router as any).handle({ ...req, url: "/" }, res, next);
});

export default router;
