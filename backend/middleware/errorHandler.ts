// backend/middleware/errorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
// Wenn du logger hast:
import logger from "../utils/logger.js"; // falls nicht vorhanden, einfach auf console umstellen

type KnownError = {
  status?: number;
  message?: string;
  code?: string | number;
  name?: string;
  errors?: unknown;
};

function isZodError(err: unknown): boolean {
  return !!(err && err.issues && Array.isArray(err.issues));
}

export function errorHandler(
  err: KnownError | any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  try {
    // Protokollierung
    try {
      logger?.error?.("[errorHandler]", err);
    } catch {
      console.error("[errorHandler]", err);
    }

    // Zod-Validierung
    if (isZodError(err)) {
      return res.status(400).json({
        message: "Ungltige Eingabe.",
        issues: err.issues,
      });
    }

    // Multer (Uploads)
    if (err instanceof MulterError) {
      return res.status(400).json({
        message: `Upload-Fehler: ${err.message}`,
        code: err.code,
      });
    }

    // JWT
    if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Ungltiges oder abgelaufenes Token.",
      });
    }

    // Mongoose: CastError / ValidationError
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "Ungltige ID." });
    }
    if (err?.name === "ValidationError") {
      return res.status(400).json({
        message: "Validierung fehlgeschlagen.",
        errors: err?.errors,
      });
    }

    // Bekannte Fehler mit Status
    if (typeof err?.status === "number") {
      return res.status(err.status).json({
        message: err.message || "Fehler",
      });
    }

    // Fallback
    return res.status(500).json({
      message: "Interner Serverfehler.",
    });
  } catch (panic) {
    // Falls der Handler selbst crasht
    console.error("[errorHandler:pure-fallback]", panic);
    return res.status(500).json({ message: "Interner Serverfehler." });
  }
}

export default errorHandler;


