// src/components/stats/GameStatsService.tsx

export interface GameLeaderboardItem {
  name: string;
  points: number;
}

export interface UserGameStat {
  game: string;
  wins: number;
  played: number;
}

/** Globales Game-Leaderboard */
export async function getGameLeaderboard(
  apiBase: string = (import.meta as any).env?.VITE_API_URL ?? "",
  token?: string | null
): Promise<GameLeaderboardItem[]> {
  try {
    const res = await fetch(`${apiBase}/api/stats/game/leaderboard`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Leaderboard request failed ${res.status}: ${body}`);
    }

    const data = (await res.json()) as unknown;

    if (
      !Array.isArray(data) ||
      !data.every(
        (i) =>
          i &&
          typeof (i as any).name === "string" &&
          typeof (i as any).points === "number"
      )
    ) {
      throw new Error("Payload does not conform to GameLeaderboardItem[] schema");
    }

    return data as GameLeaderboardItem[];
  } catch (err) {
    console.error("[getGameLeaderboard]", err);
    return [];
  }
}

/** User-spezifische Game-Stats */
export async function getUserGameStats(
  userId: string,
  apiBase: string = (import.meta as any).env?.VITE_API_URL ?? "",
  token?: string | null
): Promise<UserGameStat[]> {
  if (!userId) return [];
  try {
    const res = await fetch(`${apiBase}/api/stats/game/user/${encodeURIComponent(userId)}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`User stats request failed ${res.status}: ${body}`);
    }

    const data = (await res.json()) as unknown;

    if (
      !Array.isArray(data) ||
      !data.every(
        (s) =>
          s &&
          typeof (s as any).game === "string" &&
          typeof (s as any).wins === "number" &&
          typeof (s as any).played === "number"
      )
    ) {
      throw new Error("Payload does not conform to UserGameStat[] schema");
    }

    return data as UserGameStat[];
  } catch (err) {
    console.error("[getUserGameStats]", err);
    return [];
  }
}
