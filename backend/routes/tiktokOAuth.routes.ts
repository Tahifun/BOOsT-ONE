// backend/routes/tiktokOAuth.routes.ts
import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

/**
 * Basen sauber ableiten:
 * - BACKEND_URL: öffentliche URL deiner API (z. B. https://api.clip-boost.online)
 * - FRONTEND_URL: wohin das Browser-Redirect nach erfolgreichem OAuth gehen soll
 *
 * Fallbacks:
 * - BACKEND_URL → http://localhost:<PORT|4001>
 * - FRONTEND_URL → erster Eintrag aus CLIENT_ORIGIN, sonst http://localhost:5173
 */
const portFallback = process.env.PORT ? Number(process.env.PORT) : 4001;
const BASE_URL =
  (process.env.BACKEND_URL?.replace(/\/+$/, '')) ||
  `http://localhost:${portFallback}`;

const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const FRONTEND_URL =
  (process.env.FRONTEND_URL?.replace(/\/+$/, '')) ||
  (CLIENT_ORIGINS[0]?.replace(/\/+$/, '')) ||
  'http://localhost:5173';

// Env: akzeptiere sowohl *_CLIENT_ID als auch *_CLIENT_KEY
const TIKTOK_CLIENT_ID =
  process.env.TIKTOK_CLIENT_ID ?? process.env.TIKTOK_CLIENT_KEY ?? '';
const TIKTOK_CLIENT_SECRET =
  process.env.TIKTOK_CLIENT_SECRET ?? process.env.TIKTOK_SECRET ?? '';

// Redirect-URI dynamisch aus Backend-Basis bauen (oder explizit aus Env nehmen)
const TIKTOK_REDIRECT_URI =
  process.env.TIKTOK_REDIRECT_URI ??
  `${BASE_URL}/api/oauth/tiktok/callback`;

// Optional (kann in .env gesetzt werden)
const TIKTOK_SCOPE = process.env.TIKTOK_OAUTH_SCOPE ?? 'user.info.basic';
const STATE_SECRET = process.env.TIKTOK_OAUTH_STATE_SECRET ?? 'dev_state_secret';

// --- kleine Utils ---
function base64url(buf: Buffer) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function randomString(len = 64) {
  return base64url(crypto.randomBytes(Math.ceil((len * 3) / 4))).slice(0, len);
}

function sha256Base64Url(input: string) {
  const hash = crypto.createHash('sha256').update(input).digest();
  return base64url(hash);
}

/**
 * GET /api/oauth/tiktok
 * Leitet zu TikTok mit PKCE (S256) weiter.
 */
router.get('/', (req: Request, res: Response) => {
  if (!TIKTOK_CLIENT_ID || !TIKTOK_CLIENT_SECRET || !TIKTOK_REDIRECT_URI) {
    return res.status(500).json({ error: 'tiktok_not_configured' });
  }

  // PKCE: code_verifier (43–128 chars empfohlen)
  const codeVerifier = randomString(64);
  const codeChallenge = sha256Base64Url(codeVerifier);

  // CSRF-State
  const state = base64url(
    crypto.createHmac('sha256', STATE_SECRET).update(randomString(16)).digest(),
  );

  // In der Session ablegen (du hast express-session aktiv)
  (req.session as any).tiktok = {
    codeVerifier,
    state,
    createdAt: Date.now(),
  };

  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_ID,
    response_type: 'code',
    scope: TIKTOK_SCOPE,
    redirect_uri: TIKTOK_REDIRECT_URI,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
  return res.redirect(authUrl);
});

/**
 * GET /api/oauth/tiktok/callback
 * Tauscht den Code + PKCE Verifier gegen Tokens.
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query as Record<
      string,
      string | undefined
    >;

    if (error) {
      return res.status(400).json({ success: false, error, error_description });
    }
    if (!code || !state) {
      return res
        .status(400)
        .json({ success: false, error: 'missing_code_or_state' });
    }

    const saved = (req.session as any).tiktok;
    if (!saved || saved.state !== state) {
      return res.status(400).json({ success: false, error: 'invalid_state' });
    }

    const codeVerifier: string = saved.codeVerifier;

    // Token-Austausch
    const body = new URLSearchParams({
      client_key: TIKTOK_CLIENT_ID,
      client_secret: TIKTOK_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: TIKTOK_REDIRECT_URI,
      code_verifier: codeVerifier,
    });

    const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body,
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(502).json({
        success: false,
        error: 'token_exchange_failed',
        details: data,
      });
    }

    // Tokens in Session legen (oder DB)
    (req.session as any).tiktokTokens = {
      access_token: (data as any).access_token,
      refresh_token: (data as any).refresh_token,
      expires_in: (data as any).expires_in,
      obtained_at: Date.now(),
    };

    // Aufs Frontend weiterleiten (Prod: eigene Domain; Dev: localhost)
    const frontendBase = FRONTEND_URL.replace(/\/+$/, '');
    return res.redirect(`${frontendBase}/settings?connected=tiktok`);
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      error: 'callback_error',
      message: e?.message,
    });
  }
});

export default router;
