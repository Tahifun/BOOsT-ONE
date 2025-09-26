import fs from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";
import { UPLOAD_ROOT_ABS } from "../middleware/upload.js";

/** Speichert Metadaten / antwortet  hier minimal: gib Dateiname+Size zurück */
export async function uploadOverlay(req: Request, res: Response) {
  const f = (req as any).file as Express.Multer.File | undefined;
  if (!f) return res.status(400).json({ message: "No file" });
  return res.json({ filename: f.filename, size: f.size, mime: f.mimetype });
}

/** Listet Dateien im Upload-Ordner (Demo) */
export async function getOverlays(_req: Request, res: Response) {
  try {
    const entries = fs.readdirSync(UPLOAD_ROOT_ABS);
    const items = entries
      .filter((n) => !n.startsWith("."))
      .map((n) => {
        const full = path.join(UPLOAD_ROOT_ABS, n);
        const s = fs.statSync(full);
        return { name: n, size: s.size, ts: s.mtimeMs };
      })
      .sort((a, b) => b.ts - a.ts);
    return res.json({ items });
  } catch (e) {
    console.error("[getOverlays] error", e);
    return res.status(500).json({ message: "Failed to list overlays" });
  }
}

/** Kategorien-Dummy (bis DB/Logik da ist) */
export async function getCategories(_req: Request, res: Response) {
  return res.json({ categories: ["alerts", "labels", "frames", "badges"] });
}


