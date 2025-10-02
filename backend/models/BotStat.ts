import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Upload-Root
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const uploadRoot = path.resolve(__dirname, "..", "..", UPLOAD_DIR);
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

// MIME-Whitelist (ENV berschreibt optional)
const DEFAULT_ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const ALLOWED = (process.env.UPLOAD_MIME_WHITELIST || DEFAULT_ALLOWED.join(","))
  .split(",").map(s => s.trim()).filter(Boolean);

// 20MB Default (per ENV berschreibbar)
const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 20);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^\w.-]/g, "_")
      .slice(0, 80);
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    return cb(new Error("Unsupported file type"));
  },
});

// Fr Controller/Listing ntzlich
export const UPLOAD_ROOT_ABS = uploadRoot;

export default upload;


