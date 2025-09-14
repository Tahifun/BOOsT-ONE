// src/utils/safeJson.ts
export async function safeJson<T = any>(
  res: Response
): Promise<{ ok: boolean; data?: T; text?: string }> {
  const ct = res.headers.get("content-type") || "";
  if (ct.toLowerCase().includes("application/json")) {
    try {
      const data = (await res.json()) as T;
      return { ok: true, data };
    } catch {
      return { ok: false, text: await res.text() };
    }
  }
  return { ok: false, text: await res.text() };
}
