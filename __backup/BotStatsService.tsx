// src/components/stats/BotStatsService.tsx
import { safeJson } from "@/utils/json";

export interface BotStat {
  label: string;
  value: number;
}

/**
 * Holt Bot-Statistiken.
 * - nutzt VITE_API_URL als Basis (falls apiBase nicht gesetzt)
 * - sendet Cookies (credentials)
 * - sendet optional Authorization-Header, wenn token mitgegeben ist
 */
export async function getBotStats(
  apiBase: string = (import.meta as any).env?.VITE_API_URL ?? "",
  token?: string | null
): Promise<BotStat[]> {
  try {
    const res = await fetch(`${apiBase}/api/stats/bot`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Request failed with ${res.status}: ${body}`);
    }

    const data = (await safeJson(res)) as unknown;

    if (
      !Array.isArray(data) ||
      !data.every(
        (item) =>
          item &&
          typeof (item as any).label === "string" &&
          typeof (item as any).value === "number"
      )
    ) {
      throw new Error("Payload does not conform to BotStat[] schema");
    }

    return data as BotStat[];
  } catch (error) {
    console.error("[getBotStats]", error);
    return [];
  }
}
