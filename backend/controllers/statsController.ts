// controllers/statsController.ts
import type { Request, Response } from "express";

/** Helper: UserId aus req ziehen, egal ob user.id oder user.userId */
function getUserId(req: Request): string | undefined {
  const u: unknown = (req as any).user;
  return u?.id ?? u?.userId ?? undefined;
}

/** GET /api/stats/stream */
export const getStreamStats = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthenticated" });

  // Platzhalterwerte – hier käme echte Aggregation aus DB/Cache
  return res.json({
    ok: true,
    userId,
    totals: {
      totalGames: 0,
      totalBotCommands: 0,
      totalMediaItems: 0,
    },
    window: { from: null, to: null },
  });
};

/** GET /api/stats/user */
export const getUserAnalytics = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthenticated" });

  // Subscription-Info ggf. aus req.user; defensiv
  const tier: string | undefined = (req as any).user?.subscription?.tier;
  const isPro = tier === "PRO";

  return res.json({
    ok: true,
    userId,
    plan: tier ?? "FREE",
    isPro,
    activity: {
      sessions: 0,
      minutes: 0,
      messages: 0,
    },
    topContent: [],
  });
};

/** POST /api/stats/event */
export const recordEvent = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthenticated" });

  // Hier würdest du das Event persistieren
  return res.status(201).json({ ok: true });
};

/** GET /api/stats/export */
export const exportStats = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "unauthenticated" });

  // Dummy-Export
  const payload = {
    userId,
    generatedAt: new Date().toISOString(),
    data: [],
  };
  res.setHeader("Content-Type", "application/json");
  return res.status(200).send(JSON.stringify(payload, null, 2));
};
