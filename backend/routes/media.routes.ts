// backend/routes/media.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import multer, { MulterError } from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { attachUserFromHeaders, requireAuth } from "../middleware/auth.js";
import { getUploadByteLimitForUser } from "../config/limits.js";

const router = Router();
router.use(attachUserFromHeaders as any);

const ROOT_UPLOAD_DIR = path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads");
if (!fs.existsSync(ROOT_UPLOAD_DIR)) fs.mkdirSync(ROOT_UPLOAD_DIR, { recursive: true });

type MediaType = "clip" | "screenshot" | "sound" | "overlay";

const TYPE_MAX_MB: Record<MediaType, number> = {
  screenshot: 25,
  sound: 40,
  clip: 250,
  overlay: 200,
};

const ALLOWED_BY_TYPE: Record<MediaType, RegExp[]> = {
  screenshot: [/^image\//],
  sound: [/^audio\//],
  clip: [/^video\//],
  overlay: [/^image\//, /^video\//, /^audio\//],
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function removeFileSafe(p: string) {
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    /* no-op */
  }
}
function sanitizeFilename(name: string) {
  return name
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\-_. ]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let folder = "other";
    if (file.mimetype.startsWith("image/")) folder = "images";
    else if (file.mimetype.startsWith("video/")) folder = "videos";
    else if (file.mimetype.startsWith("audio/")) folder = "audio";
    const dest = path.join(ROOT_UPLOAD_DIR, folder);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const safeBase = sanitizeFilename(path.parse(file.originalname).name) || "upload";
    const ext = path.extname(file.originalname) || "";
    cb(null, `${safeBase}-${Date.now()}${ext}`);
  },
});

const BodySchema = z.object({
  type: z.enum(["clip", "screenshot", "sound", "overlay"]),
  name: z.string().min(1, "Name ist erforderlich").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
});

router.post(
  "/upload",
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const perUserMaxBytes = getUploadByteLimitForUser(user);
    const hardCapBytes = 300 * 1024 * 1024;
    const fileSizeLimit = Math.min(perUserMaxBytes, hardCapBytes);

    const upload = multer({
      storage,
      limits: { fileSize: fileSizeLimit },
      fileFilter: (_req, file, cb) => {
        if (
          file.mimetype.startsWith("image/") ||
          file.mimetype.startsWith("video/") ||
          file.mimetype.startsWith("audio/")
        ) {
          cb(null, true);
        } else {
          cb(new MulterError("LIMIT_UNEXPECTED_FILE"));
        }
      },
    }).single("file");

    upload(req, res, async (err: unknown) => {
      const file = (req as any).file as Express.Multer.File | undefined;

      if (err instanceof MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            error: "too_large",
            message: "Datei überschreitet das Upload-Limit.",
            limitMB: Math.round(fileSizeLimit / (1024 * 1024)),
          });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(415).json({
            error: "unsupported_type",
            message: "Dateityp nicht erlaubt.",
            allowed: ["image/*", "video/*", "audio/*"],
          });
        }
        return res.status(400).json({ error: "multer_error", code: err.code, message: err.message });
      }

      if (err) {
        if (file) removeFileSafe(file.path);
        console.error("[media/upload] error:", err);
        return res.status(500).json({ error: "server_error", message: "Interner Serverfehler beim Upload." });
      }

      try {
        if (!file) {
          return res
            .status(422)
            .json({ message: "Keine Datei empfangen.", errors: [{ field: "file", message: "Pflichtfeld" }] });
        }

        const parsed = BodySchema.safeParse(req.body);
        if (!parsed.success) {
          if (file) removeFileSafe(file.path);
          const errors = parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
          return res.status(422).json({ message: "Ungültige Eingaben.", errors });
        }
        const { type, name, description } = parsed.data;

        const mimetype = file.mimetype;
        const ok = ALLOWED_BY_TYPE[type].some((rx) => rx.test(mimetype));
        if (!ok) {
          if (file) removeFileSafe(file.path);
          const allowedHuman = {
            screenshot: ["image/*"],
            sound: ["audio/*"],
            clip: ["video/*"],
            overlay: ["image/*", "video/*", "audio/*"],
          }[type];
          return res.status(415).json({ error: "unsupported_type", allowed: allowedHuman });
        }

        const sizeBytes = file.size ?? fs.statSync(file.path).size;
        const typeMaxBytes = TYPE_MAX_MB[type] * 1024 * 1024;
        if (sizeBytes > typeMaxBytes) {
          if (file) removeFileSafe(file.path);
          return res.status(413).json({ error: "too_large", limitMB: TYPE_MAX_MB[type] });
        }

        const finalDir = path.join(ROOT_UPLOAD_DIR, "media", type);
        ensureDir(finalDir);
        const finalPath = path.join(finalDir, path.basename(file.path));
        try {
          fs.renameSync(file.path, finalPath);
        } catch {
          fs.copyFileSync(file.path, finalPath);
          if (file) removeFileSafe(file.path);
        }

        const publicBase = process.env.UPLOAD_PUBLIC_BASE || "/uploads";
        const rel = path.relative(ROOT_UPLOAD_DIR, finalPath).split(path.sep).join("/");
        const publicUrl = `${publicBase}/${rel}`;

        return res.status(201).json({
          ok: true,
          item: {
            type,
            name: sanitizeFilename(name),
            description: description || "",
            size: sizeBytes,
            mimetype,
            url: publicUrl,
          },
        });
      } catch (e) {
        if (file) removeFileSafe(file.path);
        return next(e);
      }
    });
  }
);

// Fehler-Handler NACH den Routen
router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "too_large",
        message: "Die Datei überschreitet das maximale Serverlimit.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(415).json({
        error: "unsupported_type",
        message: "Dateityp nicht erlaubt.",
        allowed: ["image/*", "video/*", "audio/*"],
      });
    }
    return res.status(400).json({ error: "multer_error", code: err.code, message: err.message });
  }

  console.error("[upload] error:", err);
  return res.status(500).json({ error: "server_error", message: "Interner Serverfehler beim Upload." });
});

export default router;
