import { Request, Response } from "express";
import Media from "../models/Media.js";
import { AuthenticatedRequest } from "../types/auth.js";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

/**
 * POST /api/media/upload
 */
export async function uploadMediaFile(req: MulterRequest & AuthenticatedRequest, res: Response) {
  if (!req.file) return res.status(400).json({ error: "Keine Datei hochgeladen" });

  const media = new Media({
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploader: req.user?.id ?? null,
    url: `/uploads/${req.file.filename}`,
  });

  await media.save();
  return res.status(201).json({ success: true, media });
}

/**
 * GET /api/media
 */
export async function getMediaFiles(req: Request, res: Response) {
  const { mimeType } = req.query as { mimeType?: string };
  const filter = mimeType ? { mimeType } : {};
  const list = await Media.find(filter).sort({ createdAt: -1 });
  return res.json({ files: list });
}

/**
 * DELETE /api/media/:id
 */
export async function deleteMediaFile(req: Request, res: Response) {
  const { id } = req.params;
  const doc = await Media.findById(id);
  if (!doc) return res.status(404).json({ error: "Datei nicht gefunden" });

  await doc.deleteOne(); // <â€” statt .remove()
  return res.json({ success: true });
}


