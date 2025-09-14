// middleware/clamScanStream.ts
import type { Request, Response, NextFunction } from "express";

/**
 * Stream-basierter ClamAV-Scan – hier als No-Op/Fallback.
 * Wenn du später clamd einhängst, pack die Logik hier rein.
 */
export default async function clamScanStream(
  _req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    // Deaktivierbar via Env, aktuell immer durchwinken
    return next();
  } catch (_e) {
    // Im Fehlerfall trotzdem weiter (oder 415, wenn du blocken willst)
    return next();
  }
}
