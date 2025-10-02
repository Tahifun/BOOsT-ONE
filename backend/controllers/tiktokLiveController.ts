// controllers/tiktokLiveController.ts
import type { Request, Response } from "express";
import liveHub from "../services/liveHub.js";

/** SSE-Stream fr Live-Status (poll-basiert, ohne Redis-Subscribe) */
export async function sseStream(req: Request, res: Response) {
  const creatorId =
    (req.query?.creatorId as string | undefined) ??
    (req as any).user?.id ??
    "anon";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const send = () => {
    const snap = liveHub.snapshot(creatorId);
    res.write(`data: ${JSON.stringify(snap)}\n\n`);
  };

  // initial push + Intervall
  send();
  const timer = setInterval(send, 3000);

  req.on("close", () => {
    clearInterval(timer);
  });

  return; // alle Pfade beenden die Funktion
}

export async function getStatus(req: Request, res: Response) {
  const creatorId =
    (req.query?.creatorId as string | undefined) ??
    (req as any).user?.id ??
    "anon";

  const snap = liveHub.snapshot(creatorId);
  return res.json({ ok: true, ...snap });
}

export async function getChat(_req: Request, res: Response) {
  return res.json({ ok: true, items: [] as unknown[] });
}

export async function getGifts(_req: Request, res: Response) {
  return res.json({ ok: true, items: [] as unknown[] });
}

export async function getLikes(_req: Request, res: Response) {
  return res.json({ ok: true, items: [] as unknown[] });
}

export async function getMetrics(req: Request, res: Response) {
  const range = Number((req.query?.range as any) ?? 60);
  return res.json({
    ok: true,
    range,
    counts: { chat: 0, gifts: 0, likes: 0 },
  });
}

export default { sseStream, getStatus, getChat, getGifts, getLikes, getMetrics };
