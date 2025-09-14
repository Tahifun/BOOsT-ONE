// src/services/botService.ts
export interface BotStatus {
  connected: boolean;
  uptime?: string;
  messageCount?: number;
  activeUsers?: number;
  channels?: string[];
  [k: string]: unknown;
}

const API_BASE: string =
  (import.meta as any)?.env?.VITE_API_URL?.toString() || "http://localhost:4001";

type HeadersLike = Record<string, string>;

/**
 * Baut Standard-Header: JSON + optional Bearer
 */
function buildHeaders(token?: string | null): HeadersLike {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Wrap für fetch mit Cookie-Support + optionalem JWT
 */
async function fetchJSON<T>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",    // <-- wichtig für Session-Cookies
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as T;
}

/**
 * GET /api/bot/status
 */
export async function getBotStatus(token?: string | null): Promise<BotStatus> {
  return fetchJSON<BotStatus>(`${API_BASE}/api/bot/status`, {
    headers: buildHeaders(token),
  });
}

/**
 * POST /api/bot/command
 * Body: { command: string; args?: Record<string, unknown> }
 */
export async function sendBotCommand(
  command: string,
  args: Record<string, unknown> = {},
  token?: string | null
): Promise<{ ok: true } & Record<string, unknown>> {
  const payload = { command, args };
  return fetchJSON(`${API_BASE}/api/bot/command`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  }) as Promise<{ ok: true } & Record<string, unknown>>;
}

/**
 * OPTIONALER Stub – nur für UI-Konsistenz:
 * Es gibt KEINE Backend-Route /api/bot/connection/twitch/toggle.
 * Wenn du die UI-Schaltfläche behalten willst, kannst du hier
 * einen Command senden, den dein Bot interpretiert (sofern implementiert),
 * z. B. command="toggle_twitch".
 */
export async function toggleTwitchConnectionViaCommand(
  token?: string | null
): Promise<boolean> {
  try {
    await sendBotCommand("toggle_twitch", {}, token);
    return true;
  } catch {
    return false;
  }
}
