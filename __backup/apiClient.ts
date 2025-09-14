// src/lib/apiClient.ts
export const API = "/api";

export async function api<T = any>(
  path: string,
  opts: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(opts.headers || {});
  if (!headers.has("Content-Type") && opts.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    ...opts,
    headers,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}
