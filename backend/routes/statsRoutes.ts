// backend/routes/statsRoutes.ts
import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireTier } from '../middleware/requireTier.js';

const router = Router();

// All stats routes require auth (adjust as needed)
router.use(requireAuth);

// Example: simple health for the stats module
router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, scope: 'stats' });
});

// ---- Bot stats (placeholder implementation) ----
router.get('/bot', requireTier('PRO'), async (_req: Request, res: Response) => {
  // TODO: wire up to real service/controller
  res.json({ ok: true, metrics: { uptimeSeconds: 0, commandsHandled: 0 } });
});

// ---- Game stats (placeholder implementation) ----
router.get('/game', requireTier('PRO'), async (_req: Request, res: Response) => {
  // TODO: wire up to real service/controller
  res.json({ ok: true, metrics: { activePlayers: 0, peakPlayers: 0 } });
});

// ---- CSV export ------------------------------------------------------------
// GET /stats/export.csv?from=2025-01-01&to=2025-01-07
router.get('/export.csv', requireTier('PRO'), async (req: Request, res: Response) => {
  const fromStr = String(req.query.from ?? '');
  const toStr = String(req.query.to ?? '');
  const from = parseISODate(fromStr);
  const to = parseISODate(toStr);

  if (!from || !to || from > to) {
    res.status(400).json({ ok: false, error: 'invalid_range', hint: 'Use from=YYYY-MM-DD&to=YYYY-MM-DD' });
    return;
  }

  // Replace with real aggregation when ready:
  const csv = await buildCsvFromMock(from, to);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="stats_${formatDate(from)}_${formatDate(to)}.csv"`);
  res.send(csv);
});

// ---------------- Helpers ---------------------------------------------------

function parseISODate(s: string): Date | null {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s)) return null;
  const d = new Date(s + 'T00:00:00.000Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, by: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + by);
  return copy;
}

async function buildCsvFromMock(from: Date, to: Date): Promise<string> {
  const header = 'date,active_users,new_signups,commands,errors\n';
  let rows = '';
  for (let cur = new Date(from); cur <= to; cur = addDays(cur, 1)) {
    // mock numbers – replace with DB aggregation
    const date = formatDate(cur);
    const active = 100 + Math.floor(Math.random() * 50);
    const signups = 5 + Math.floor(Math.random() * 10);
    const commands = 200 + Math.floor(Math.random() * 100);
    const errors = Math.floor(commands * 0.02);
    rows += `${date},${active},${signups},${commands},${errors}\n`;
  }
  return header + rows;
}

export default router;
