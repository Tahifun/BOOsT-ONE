// routes/spotify.routes.ts
import express, { type Request, type Response, type RequestHandler } from "express";
import crypto from "crypto";

const router = express.Router();

// --- Middleware -------------------------------------------------------------
const ensureSession: RequestHandler = (req, res, next) => {
  if (!req.session) {
    res.status(500).json({ error: "session_unavailable" });
    return;
  }
  return next();
};

const ensureSpotify: RequestHandler = (_req, res, next) => {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    res.status(503).json({ error: "spotify_not_configured" });
    return;
  }
  return next();
};

// --- OAuth: Kickoff ---------------------------------------------------------
router.get("/auth/login", ensureSession, ensureSpotify, (req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString("hex");
  (req.session as any).spotify_state = state;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: [
      "user-read-private",
      "user-read-email",
      "user-read-playback-position",
      "user-read-recently-played",
      "playlist-read-private",
      "playlist-read-collaborative",
      "user-read-playback-state",
      "user-modify-playback-state",
      "streaming",
    ].join(" "),
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    state,
  });
  return res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

// --- OAuth: Callback --------------------------------------------------------
router.get("/auth/callback", ensureSession, ensureSpotify, async (req: Request, res: Response) => {
  const code = String(req.query.code ?? "");
  const state = String(req.query.state ?? "");

  if (!code || !state || state !== (req.session as any).spotify_state) {
    return res.status(400).json({ error: "invalid_state" });
  }

  const tokenUrl = "https://accounts.spotify.com/api/token";
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
  });

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    return res.status(502).json({ error: "token_exchange_failed", details: text });
  }

  const tokens = (await resp.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
  };

  (req.session as any).spotify_tokens = tokens;
  return res.redirect(process.env.SPOTIFY_POST_LOGIN_REDIRECT ?? "/");
});

// --- API helpers ------------------------------------------------------------
type HeadersInitLoose = Record<string, string>;
function authHeader(accessToken: string): HeadersInitLoose {
  return { Authorization: `Bearer ${accessToken}` };
}

function requireAccess(res: Response, tokens?: { access_token: string }) {
  if (!tokens?.access_token) {
    res.status(401).json({ error: "no_access_token" });
    return false;
  }
  return true;
}

// --- Current user -----------------------------------------------------------
router.get("/me", ensureSession, async (req: Request, res: Response) => {
  const tokens = (req.session as any).spotify_tokens as { access_token: string } | undefined;
  if (!requireAccess(res, tokens)) return;
  const r = await fetch("https://api.spotify.com/v1/me", { headers: authHeader(tokens!.access_token) });
  return res.status(r.status).send(await r.text());
});

// --- Playlists --------------------------------------------------------------
router.get("/user-playlists", ensureSession, async (req: Request, res: Response) => {
  const tokens = (req.session as any).spotify_tokens as { access_token: string } | undefined;
  if (!requireAccess(res, tokens)) return;
  const url = new URL("https://api.spotify.com/v1/me/playlists");
  url.searchParams.set("limit", String(req.query.limit ?? "20"));
  const r = await fetch(url, { headers: authHeader(tokens!.access_token) } as any);
  return res.status(r.status).send(await r.text());
});

router.get("/playlist/:id/tracks", ensureSession, async (req: Request, res: Response) => {
  const tokens = (req.session as any).spotify_tokens as { access_token: string } | undefined;
  if (!requireAccess(res, tokens)) return;
  const url = new URL(`https://api.spotify.com/v1/playlists/${encodeURIComponent(req.params.id)}/tracks`);
  url.searchParams.set("limit", String(req.query.limit ?? "100"));
  const r = await fetch(url, { headers: authHeader(tokens!.access_token) } as any);
  return res.status(r.status).send(await r.text());
});

// --- Player -----------------------------------------------------------------
router.get("/player/state", ensureSession, async (req: Request, res: Response) => {
  const tokens = (req.session as any).spotify_tokens as { access_token: string } | undefined;
  if (!requireAccess(res, tokens)) return;
  const r = await fetch("https://api.spotify.com/v1/me/player", { headers: authHeader(tokens!.access_token) } as any);
  return res.status(r.status).send(await r.text());
});

router.post("/player/play", ensureSession, async (req: Request, res: Response) => {
  const tokens = (req.session as any).spotify_tokens as { access_token: string } | undefined;
  if (!requireAccess(res, tokens)) return;
  const r = await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: { ...authHeader(tokens!.access_token), "Content-Type": "application/json" } as any,
    body: JSON.stringify(req.body ?? {}),
  });
  return res.status(r.status).send(await r.text());
});

router.post("/player/pause", ensureSession, async (req: Request, res: Response) => {
  const tokens = (req.session as any).spotify_tokens as { access_token: string } | undefined;
  if (!requireAccess(res, tokens)) return;
  const r = await fetch("https://api.spotify.com/v1/me/player/pause", {
    method: "PUT",
    headers: authHeader(tokens!.access_token) as any,
  });
  return res.status(r.status).send(await r.text());
});

// --- Logout -----------------------------------------------------------------
router.post("/logout", ensureSession, (req: Request, res: Response) => {
  delete (req.session as any).spotify_tokens;
  delete (req.session as any).spotify_state;
  return res.json({ ok: true });
});

export default router;
