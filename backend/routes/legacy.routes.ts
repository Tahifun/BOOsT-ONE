// backend/routes/legacy.routes.ts
import { Router } from "express";
const r = Router();

// Alte/vertippte TikTok-Login-URLs -> neuer Pfad
const legacyLoginPaths = [
  "/tiktok/login",
  "/tiktok/oauth/login",
  "/oauth/tiktok/login",
];

legacyLoginPaths.forEach((p) => {
  r.get(p, (_req, res) => res.redirect(302, "/api/oauth/tiktok"));
});

// Alte/vertippte Callback-URLs -> neuer Pfad
const legacyCallbackPaths = [
  "/tiktok/callback",
  "/tiktok/oauth/callback",
];

legacyCallbackPaths.forEach((p) => {
  r.all(p, (_req, res) => res.redirect(307, "/api/oauth/tiktok/callback"));
});

export default r;
