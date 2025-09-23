// backend/routes/tiktokOAuth.routes.ts
import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

/** Basis-URLs */
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

/** TikTok ENV */
const TIKTOK_CLIENT_ID =
  process.env.TIKTOK_CLIENT_ID ?? process.env.TIKTOK_CLIENT_KEY ?? '';
const TIKTOK_CLIENT_SECRET =
  process.env.TIKTOK_CLIENT_SECRET ?? process.env.TIKTOK_SECRET ?? '';

const TIKTOK_REDIRECT_URI =
  process.env.TIKTOK_REDIRECT_URI ??
  `${BASE_URL}/api/oauth/tiktok/callback`;

const TIKTOK_SCOPE = process.env.TIKTOK_OAUTH_SCOPE ?? 'user.info.basic';
const STATE_SECRET = process.env.TIKTOK_OAUTH_STATE_SECRET ?? 'dev_state_secret';

/** Utils */
function b64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function rand(len = 64) {
  return b64url(crypto.randomBytes(Math.ceil((len * 3) / 4))).slice(0, len);
}
function sha256b64url(input: string) {
  const hash = crypto.createHash('sha256').update(input).digest();
  return b64url(hash);
}

/** gemeinsamer Start-Handler */
function startAuth(req: Request, res: Response) {
  if (!TIKTOK_CLIENT_ID || !TIKTOK_CLIENT_SECRET || !TIKTOK_REDIRECT_URI) {
    return res.status(500).json({ error: 'tiktok_not_configured' });
  }

  const codeVerifier = rand(64);
  const codeChallenge = sha256b64url(codeVerifier);
  const state = b64url(crypto.createHmac('sha256', STATE_SECRET).update(rand(16)).digest());

  (req.session as any).tiktok = { codeVerifier, state, createdAt: Date.now() };

  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_ID,
    response_type: 'code',
    scope: TIKTOK_SCOPE,
    redirect_uri: TIKTOK_REDIRECT_URI,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  res.redirect(`https://www.tiktok.com/v2/auth/authorize?${params.toString()}`);
}

/** Aliasse */
router.get('/', startAuth);       // /api/oauth/tiktok
router.get('/auth', startAuth);   // /api/oauth/tiktok/auth

/** Callback */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query as Record<string, string | undefined>;
    if (error) return res.status(400).json({ success: false, error, error_description });
    if (!code || !state) return res.status(400).json({ success: false, error: 'missing_code_or_state' });

    const saved = (req.session as any).tiktok;
    if (!saved || saved.state !== state) return res.status(400).json({ success: false, error: 'invalid_state' });

    const body = new URLSearchParams({
      client_key: TIKTOK_CLIENT_ID,
      client_secret: TIKTOK_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: TIKTOK_REDIRECT_URI,
      code_verifier: saved.codeVerifier,
    });

    const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body,
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(502).json({ success: false, error: 'token_exchange_failed', details: data });
    }

    (req.session as any).tiktokTokens = {
      access_token: (data as any).access_token,
      refresh_token: (data as any).refresh_token,
      expires_in: (data as any).expires_in,
      obtained_at: Date.now(),
    };

    const fe = FRONTEND_URL.replace(/\/+$/, '');
    return res.redirect(`${fe}/settings?connected=tiktok`);
  } catch (e: any) {
    return res.status(500).json({ success: false, error: 'callback_error', message: e?.message });
  }
});

export default router;
