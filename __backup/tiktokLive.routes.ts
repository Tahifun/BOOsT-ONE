// backend/routes/tiktokLive.routes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireTier } from "../middleware/requireTier.js";
import {
  sseStream,
  getStatus,
  getChat,
  getGifts,
  getLikes,
  getMetrics,
} from "../controllers/tiktokLiveController.js";

const router = Router();

/**
 * @openapi
 * /api/tiktok/live/sse:
 *   get:
 *     summary: Server-Sent Events Stream (PRO)
 *     tags: [TikTok Live]
 *     parameters:
 *       - in: query
 *         name: creatorId
 *         schema: { type: string }
 *         description: Optional; sonst aus Token (req.user.id)
 *     responses:
 *       200: { description: Event-Stream }
 */
router.get("/sse", requireAuth, requireTier("pro"), sseStream);

/**
 * @openapi
 * /api/tiktok/live/status:
 *   get:
 *     summary: Aktueller Live-Status (Polling)
 *     tags: [TikTok Live]
 */
router.get("/status", requireAuth, getStatus);

/**
 * @openapi
 * /api/tiktok/live/chat:
 *   get:
 *     summary: Chat-Events seit Timestamp (Polling)
 *     tags: [TikTok Live]
 *     parameters:
 *       - in: query
 *         name: since
 *         schema: { type: integer }
 */
router.get("/chat", requireAuth, getChat);

/**
 * @openapi
 * /api/tiktok/live/gifts:
 *   get:
 *     summary: Gift-Events seit Timestamp (Polling)
 *     tags: [TikTok Live]
 */
router.get("/gifts", requireAuth, getGifts);

/**
 * @openapi
 * /api/tiktok/live/likes:
 *   get:
 *     summary: Like-Events seit Timestamp (Polling)
 *     tags: [TikTok Live]
 */
router.get("/likes", requireAuth, getLikes);

/**
 * @openapi
 * /api/tiktok/live/metrics:
 *   get:
 *     summary: Aggregierte Kennzahlen (Window via ?range=Sekunden)
 *     tags: [TikTok Live]
 */
router.get("/metrics", requireAuth, getMetrics);

// Alias auf Status
router.get("/", requireAuth, getStatus);

export default router;


