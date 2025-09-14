/** Safes JSON.parse mit Fallback */
export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn("safeParse fallback", { snippet: raw?.slice(0, 200) });
    return fallback;
  }
}

/** Safes JSON.parse: null bei Fehler/leer */
export function safeParseNullable<T>(raw: string | null | undefined): T | null {
  try {
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Sicheres Response-Parsing für Fetch:
 * - wirft bei !ok (inkl. Body-Snippet)
 * - 204/empty → null
 * - JSON via content-type ODER heuristisch
 */
export async function safeJson<T = unknown>(res: Response): Promise<T | null> {
  const ct = res.headers.get("content-type") || "";
  const body = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
  }
  if (!body.trim()) return null;

  const tryParse = () => {
    try { return JSON.parse(body) as T; } catch { return null; }
  };

  if (ct.includes("application/json")) {
    const parsed = tryParse();
    if (parsed !== null) return parsed;
  }
  const fallback = tryParse();
  if (fallback !== null) return fallback;

  throw new Error(`Expected JSON from ${res.url} but got ${ct || "unknown"}`);
}
