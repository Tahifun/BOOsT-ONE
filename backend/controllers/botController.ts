// controllers/botController.ts
import type { Request, Response } from "express";

/** Fängt generische Bot-Kommandos ab (Platzhalter) */
export async function runCommand(_req: Request, res: Response) {
  try {
    const result = {} as any;
    const { success: _ignore, ...rest } = (result ?? {}) as any; // Doppel-"success" vermeiden
    return res.json({ success: true, ...rest });
  } catch (e: unknown) {
    return res.status(500).json({ success: false, error: e?.message ?? "bot_error" });
  }
}

/** Minimaler Status-Endpunkt */
export async function getStatus(_req: Request, res: Response) {
  return res.json({ ok: true, status: "idle" });
}

export default { runCommand, getStatus };
