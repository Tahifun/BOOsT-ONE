// backend/middleware/tiktokAutoRefresh.ts
import { Request, Response, NextFunction } from "express";
import axios from "axios";
import qs from "qs";

const TT_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const { TIKTOK_CLIENT_KEY: CLIENT_KEY, TIKTOK_CLIENT_SECRET: CLIENT_SECRET, NODE_ENV } = process.env;

const isProd = NODE_ENV === "production";
const cookieOpts = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
};
const msFromSeconds = (sec?: number) => Math.max(0, Number(sec || 0) * 1000);

export default async function ensureTikTokAccessToken(req: Request, res: Response, next: NextFunction) {
  try {
    const at = req.cookies?.["tt_at"];
    const atExp = Number(req.cookies?.["tt_at_exp"] || 0);
    const rt = req.cookies?.["tt_rt"];

    // g�ltig?
    if (at && atExp && Date.now() < atExp) {
      return next();
    }

    // kein Refresh vorhanden  401
    if (!rt) {
      return res.status(401).json({ error: "no_refresh_token" });
    }

    // Refresh holen
    const { data } = await axios.post(
      TT_TOKEN_URL,
      qs.stringify({
        client_key: CLIENT_KEY!,
        client_secret: CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: rt,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 15000 }
    );

    const { access_token, expires_in, refresh_token, refresh_expires_in, open_id } = data || {};
    if (!access_token || !refresh_token) {
      return res.status(401).json({ error: "refresh_failed", details: data });
    }

    const now = Date.now();
    res.cookie("tt_at", access_token, { ...cookieOpts, maxAge: msFromSeconds(expires_in) });
    res.cookie("tt_rt", refresh_token, { ...cookieOpts, maxAge: msFromSeconds(refresh_expires_in) });
    res.cookie("tt_at_exp", String(now + msFromSeconds(expires_in) - 60_000), { ...cookieOpts, maxAge: msFromSeconds(expires_in) });
    res.cookie("tt_rt_exp", String(now + msFromSeconds(refresh_expires_in) - 60_000), { ...cookieOpts, maxAge: msFromSeconds(refresh_expires_in) });
    if (open_id) res.cookie("tt_open_id", String(open_id), { ...cookieOpts, maxAge: msFromSeconds(refresh_expires_in) });

    return next();
  } catch (err: unknown) {
    return res.status(401).json({ error: "auto_refresh_error", details: String(err.message || err) });
  }
}


