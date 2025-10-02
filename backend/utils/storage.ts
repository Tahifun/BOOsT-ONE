// backend/utils/storage.ts
import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirname fr ES-Module herstellen
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

// absoluter Upload-Pfad relativ zu dieser Datei (/backend/utils  ../..)
export const uploadPath = path.resolve(__dirname, "..", "..", UPLOAD_DIR);

// Verzeichnis sicherstellen (rekursiv)
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// kleine Helferfunktion zum Auflsen von Unterordnern
export function resolveUpload(...parts: string[]) {
  return path.join(uploadPath, ...parts);
}

export default uploadPath;


