// src/services/tiktokLiveService.ts
const API_BASE: string =
  (import.meta as any)?.env?.VITE_API_URL?.toString() || "http://localhost:4001";

export type LiveEventType = "status" | "chat" | "gift" | "like" | "system";

export interface LiveEvent<T = any> {
  id: number;
  ts: number;
  type: LiveEventType;
  data: T;
}

export type LiveCallback = (ev: LiveEvent) => void;

/** PRO: Verbinde per SSE (Server-Sent Events) */
export function connectSSE(creatorId: string, onEvent: LiveCallback) {
  const url = `${API_BASE}/api/tiktok/live/stream?creatorId=${encodeURIComponent(creatorId)}`;
  const es = new EventSource(url, { withCredentials: true } as EventSourceInit);

  // generische Events (falls der Server ohne "event:" sendet)
  es.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      if (data && data.type) onEvent(data);
    } catch {}
  };

  // spezifische Events
  const types: LiveEventType[] = ["status", "chat", "gift", "like", "system"];
  types.forEach((t) => {
    es.addEventListener(t, (evt: MessageEvent) => {
      try {
        const data = JSON.parse(evt.data) as LiveEvent;
        onEvent(data);
      } catch {}
    });
  });

  es.onerror = () => {
    // Browser versucht auto-Reconnect (per "retry")
    // Du kannst hier UI-Status setzen.
  };

  return {
    close: () => es.close(),
  };
}

/** FREE: REST-Polling - Basis-Calls */
export async function getStatus(creatorId: string) {
  const res = await fetch(`${API_BASE}/api/tiktok/live/status?creatorId=${encodeURIComponent(creatorId)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getChatSince(creatorId: string, since = 0) {
  const res = await fetch(
    `${API_BASE}/api/tiktok/live/chat?creatorId=${encodeURIComponent(creatorId)}&since=${since}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{ items: LiveEvent[] }>;
}

export async function getGiftsSince(creatorId: string, since = 0) {
  const res = await fetch(
    `${API_BASE}/api/tiktok/live/gifts?creatorId=${encodeURIComponent(creatorId)}&since=${since}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{ items: LiveEvent[] }>;
}

export async function getMetrics(creatorId: string, rangeSec = 300) {
  const res = await fetch(
    `${API_BASE}/api/tiktok/live/metrics?creatorId=${encodeURIComponent(creatorId)}&range=${rangeSec}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{ rangeSec: number; chat: number; gifts: number; likes: number }>;
}

/** FREE: kleiner Poller - ruft periodisch REST und reicht Events an onEvent */
export function startFreePolling(
  creatorId: string,
  onEvent: LiveCallback,
  intervalMs = 5000
) {
  let sinceChat = 0;
  let sinceGifts = 0;
  let timer: unknown = null;
  let closed = false;

  const tick = async () => {
    try {
      const status = await getStatus(creatorId);
      onEvent({ id: 0, ts: Date.now(), type: "status", data: status });

      const chat = await getChatSince(creatorId, sinceChat);
      chat.items.forEach((ev) => onEvent(ev));
      if (chat.items.length) sinceChat = chat.items[chat.items.length - 1].id;

      const gifts = await getGiftsSince(creatorId, sinceGifts);
      gifts.items.forEach((ev) => onEvent(ev));
      if (gifts.items.length) sinceGifts = gifts.items[gifts.items.length - 1].id;
    } catch {
      // optional: Fehler-Handling & Backoff
    } finally {
      if (!closed) timer = setTimeout(tick, intervalMs);
    }
  };

  tick();

  return {
    close: () => {
      closed = true;
      if (timer) clearTimeout(timer);
    },
  };
}
