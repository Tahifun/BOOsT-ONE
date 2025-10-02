import { Router } from "express";
import upload from "../middleware/upload.js";
import clamScan from "../middleware/clamScan.js";
import { uploadOverlay, getOverlays, getCategories } from "../controllers/overlayController.js";
import { attachUserFromHeaders, requireAuth } from "../middleware/auth.js";
import { RateLimits } from "../middleware/rateLimitMiddleware.js";

const router = Router();

// macht req.user "soft" verfgbar (kein 401)
router.use(attachUserFromHeaders as any);

/**
 * @openapi
 * /api/overlays/upload:
 *   post:
 *     summary: Overlay-Datei hochladen
 *     tags: [Overlays]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               overlay:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Upload ok }
 *       400: { description: Keine Datei }
 *       415: { description: Malware vermutet oder Scan-Fehler }
 */
router.post(
  "/upload",
  requireAuth,                                 // <- auth entfernt
  (RateLimits as any).upload ?? RateLimits.general,
  upload.single("overlay"),
  clamScan,
  uploadOverlay
);

/**
 * @openapi
 * /api/overlays:
 *   get:
 *     summary: Liste der vorhandenen Overlays
 *     tags: [Overlays]
 *     responses:
 *       200: { description: Liste }
 */
router.get("/", getOverlays);

/**
 * @openapi
 * /api/overlays/categories:
 *   get:
 *     summary: Verfgbare Kategorien (Demo)
 *     tags: [Overlays]
 *     responses:
 *       200: { description: Kategorien }
 */
router.get("/categories", getCategories);

export default router;
