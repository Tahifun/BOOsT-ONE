// src/utils/fetchJson.ts
export class HttpError extends Error {
  status: number;
  bodyPreview?: string;
  constructor(message: string, status: number, bodyPreview?: string) {
    super(message);
    this.status = status;
    this.bodyPreview = bodyPreview;
  }
}

export async function fetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  const ct = (res.headers.get("content-type") || "").toLowerCase();

  if (!ct.includes("application/json")) {
    // Fallback: Body lesen (geclont) fr Debug
    const clone = res.clone();
    const txt = await clone.text().catch(() => "");
    throw new HttpError(
      `Expected JSON but got '${ct || "unknown"}'`,
      res.status,
      txt?.slice(0, 300)
    );
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    const clone = res.clone?.();
    const txt = clone ? await clone.text().catch(() => "") : """";
    throw new HttpError("Invalid JSON response", res.status, txt?.slice(0, 300));
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || res.statusText;
    throw new HttpError(String(msg || "Request failed"), res.status, JSON.stringify(data).slice(0, 300));
  }

  return data as T;
}
