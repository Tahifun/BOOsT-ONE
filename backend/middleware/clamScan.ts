// middleware/clamScan.ts
import type { Request, Response, NextFunction } from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Scannt (optional) die hochgeladene Datei mit ClamAV.
 * - Deaktivierbar ber env: CLAMSCAN_DISABLE=1
 * - Pfad anpassbar ber env: CLAMSCAN_PATH
 */
export default async function clamScan(req: Request, res: Response, next: NextFunction) {
  try {
    if (process.env.CLAMSCAN_DISABLE === "1") return next();

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file?.path) return next();

    const cmd = process.env.CLAMSCAN_PATH || "clamscan";
    const args = ["--no-summary", file.path];

    const { stdout /* , stderr */ } = await execFileAsync(cmd, args, { timeout: 20000 });

    // clamscan gibt in stdout Infos aus; simple Heuristik
    if (typeof stdout === "string" && /Infected files:\s*1/i.test(stdout)) {
      return res.status(415).json({ error: "malware_suspected" });
    }

    return next();
  } catch (err: unknown) {
    // ClamAV nicht installiert ? weich durchwinken
    if (err?.code === "ENOENT") return next();

    // clamscan Exit-Code bei Fund ist typischerweise 1; stdout kann darauf hinweisen
    if (typeof err?.stdout === "string" && /Infected files:\s*1/i.test(err.stdout)) {
      return res.status(415).json({ error: "malware_detected" });
    }

    // sonst konservativ blocken, aber klarer Fehler
    return res.status(415).json({ error: "scan_error" });
  }
}
