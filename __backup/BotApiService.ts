// src/services/BotApiService.ts
export type BotCommandResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

/**
 * Sendet einen Bot-Command an das Backend.
 * Erwartet Antwort vom Shape: { success: boolean; message?: string; data?: T }
 */
export async function sendBotCommand<T = unknown>(
  command: string,
  payload?: unknown
): Promise<BotCommandResponse<T>> {
  try {
    const res = await fetch("/api/bot/command", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ command, payload }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text || "Fehler beim Bot-Command"}`);
    }

    const json = (await res.json()) as BotCommandResponse<T>;

    // Konsistente Behandlung: wenn success=false, als Fehler darstellen
    if (!json.success) {
      throw new Error(json.message || "Bot-Command fehlgeschlagen.");
    }

    return json;
  } catch (err: unknown) {
    console.error("[BotApiService] sendBotCommand error:", err);
    // Normiere in erwartbares Format
    return {
      success: false,
      message: err?.message || "Unbekannter Fehler",
    } as BotCommandResponse<T>;
  }
}
