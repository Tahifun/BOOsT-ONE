// backend/routes/tiktokOAuth.routes.ts
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

const router = Router();

/**
 * Konfiguration – stelle sicher, dass diese ENV-Variablen gesetzt sind.
 */
const TIKTOK_CLIENT_ID = process.env.TIKTOK_CLIENT_ID ?? '';
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET ?? '';
const TIKTOK_REDIRECT_URI =
  process.env.TIKTOK_REDIRECT_URI ?? 'http://localhost:4001/api/oauth/tiktok/callback';

const CallbackQuery = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
});

/**
 * OAuth: Redirect zur TikTok Authorization
 * GET /api/oauth/tiktok
 */
router.get('/', (_req: Request, res: Response) => {
  if (!TIKTOK_CLIENT_ID) {
    res.status(500).json({ error: 'tiktok_not_configured' });
    return;
  }
  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_ID,
    response_type: 'code',
    scope: 'user.info.basic',
    redirect_uri: TIKTOK_REDIRECT_URI,
    state: 'csrf_' + Math.random().toString(36).slice(2),
  });
  res.redirect(`https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`);
});

/**
 * OAuth: Callback – tauscht Code gegen Access-Token
 * GET /api/oauth/tiktok/callback
 */
router.get('/callback', async (req: Request, res: Response) => {
  if (!TIKTOK_CLIENT_ID || !TIKTOK_CLIENT_SECRET) {
    res.status(500).json({ error: 'tiktok_not_configured' });
    return;
  }

  const parsed = CallbackQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_query', details: parsed.error.flatten() });
    return;
  }

  try {
    const body = new URLSearchParams({
      client_key: TIKTOK_CLIENT_ID,
      client_secret: TIKTOK_CLIENT_SECRET,
      code: parsed.data.code,
      grant_type: 'authorization_code',
      redirect_uri: TIKTOK_REDIRECT_URI,
    });

    const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (!resp.ok) {
      const text = await resp.text();
      res.status(502).json({ error: 'tiktok_exchange_failed', status: resp.status, text });
      return;
    }

    const tokenSet = (await resp.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
      [k: string]: unknown;
    };

    if (!tokenSet.access_token) {
      res.status(502).json({ error: 'tiktok_no_access_token', tokenSet });
      return;
    }

    // TODO: userinfo ziehen & im System verknüpfen
    res.json({ ok: true, tokenSet });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'tiktok_callback_error', message });
  }
});

export default router;
