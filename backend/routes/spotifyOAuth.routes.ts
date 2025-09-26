// routes/spotifyOAuth.routes.ts
import { Router, Request, Response } from "express";
import axios from "axios";
import qs from "qs";
import crypto from "crypto";
import { z } from "zod";
import { attachUserFromHeaders, requireAuth } from "../middleware/auth.js";
import SpotifyToken from "../models/SpotifyToken.js";

const router = Router();
router.use(attachUserFromHeaders as any);

const {
  SPOTIFY_CLIENT_ID: CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: CLIENT_SECRET,
  NODE_ENV,
} = process.env;

const isProd = NODE_ENV === "production";
const cookieOpts = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
};

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function genRandomString(bytes = 32) { return base64UrlEncode(crypto.randomBytes(bytes)); }
function sha256(input: string) { return crypto.createHash("sha256").update(input).digest(); }

router.get("/state", requireAuth, async (_req: Request, res: Response) => {
  if (!CLIENT_ID || !CLIENT_SECRET) return res.status(501).json({ error: "spotify_not_configured" });
  const state = genRandomString(16);
  const codeVerifier = genRandomString(64);
  const codeChallenge = base64UrlEncode(sha256(codeVerifier));
  res.cookie("sp_state", state, { ...cookieOpts, maxAge: 10 * 60_000 });
  res.cookie("sp_pkce_verifier", codeVerifier, { ...cookieOpts, maxAge: 10 * 60_000 });
  return res.json({ state, code_challenge: codeChallenge, code_challenge_method: "S256" });
});

router.post("/exchange", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) return res.status(501).json({ error: "spotify_not_configured" });
    const Body = z.object({ code: z.string().min(1), state: z.string().optional(), redirect_uri: z.string().url() });
    const { code, state, redirect_uri } = Body.parse(req.body);

    const stateCookie = (req.cookies?.sp_state as string) || undefined;
    if (state && stateCookie && state !== stateCookie) return res.status(400).json({ error: "state_mismatch" });

    const codeVerifier = req.cookies?.sp_pkce_verifier as string | undefined;
    if (!codeVerifier) return res.status(400).json({ error: "missing_code_verifier" });

    ["sp_state", "sp_pkce_verifier"].forEach((c) => res.clearCookie(c, { ...cookieOpts }));

    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      qs.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 15000 }
    );

    const { access_token, token_type, scope, expires_in, refresh_token } = tokenRes.data || {};
    if (!access_token || !refresh_token) return res.status(400).json({ error: "spotify_exchange_failed" });

    const expiresAt = new Date(Date.now() + Number(expires_in || 3600) * 1000);

    await SpotifyToken.findOneAndUpdate(
      { userId: (req as any).user.id },
      { accessToken: access_token, refreshToken: refresh_token, tokenType: token_type || "Bearer", scope, expiresAt },
      { upsert: true, new: true }
    );

    return res.status(204).send();
  } catch (err: unknown) {
    if (err.response) return res.status(err.response.status).json({ error: "spotify_error", details: err.response.data });
    return res.status(400).json({ error: "bad_request", details: String(err.message || err) });
  }
});

router.post("/refresh", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) return res.status(501).json({ error: "spotify_not_configured" });
    const doc = await SpotifyToken.findOne({ userId: (req as any).user.id });
    if (!doc?.refreshToken) return res.status(401).json({ error: "no_refresh_token" });

    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    const { data } = await axios.post(
      "https://accounts.spotify.com/api/token",
      qs.stringify({ grant_type: "refresh_token", refresh_token: doc.refreshToken }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basic}` }, timeout: 15000 }
    );

    const { access_token, expires_in, refresh_token, token_type, scope } = data || {};
    if (!access_token) return res.status(400).json({ error: "spotify_refresh_failed" });

    const update: unknown = {
      accessToken: access_token,
      expiresAt: new Date(Date.now() + Number(expires_in || 3600) * 1000),
      tokenType: token_type || "Bearer",
      scope: scope || (doc as any).scope,
    };
    if (refresh_token) update.refreshToken = refresh_token;

    await SpotifyToken.updateOne({ userId: (req as any).user.id }, { $set: update }, { upsert: true });
    return res.status(204).send();
  } catch (err: unknown) {
    if (err.response) return res.status(err.response.status).json({ error: "spotify_error", details: err.response.data });
    return res.status(400).json({ error: "bad_request", details: String(err.message || err) });
  }
});

router.post("/disconnect", requireAuth, async (req: Request, res: Response) => {
  await SpotifyToken.deleteOne({ userId: (req as any).user.id });
  return res.status(204).send();
});

export default router;
