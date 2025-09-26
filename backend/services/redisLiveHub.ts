// services/redisLiveHub.ts
import { Redis } from "ioredis";

type Status = { connected: boolean; disabled?: boolean };

const DISABLED =
  process.env.LIVEHUB_DISABLE_REDIS === "1" || !process.env.REDIS_URL;

type API = {
  publish: (channel: string, type: string, data: unknown) => Promise<void>;
  subscribe: (
    channel: string,
    handler: (msg: unknown) => void
  ) => Promise<void>;
  getStatus: () => Status;
};

let api: API;

if (DISABLED) {
  api = {
    publish: async () => {},
    subscribe: async () => {},
    getStatus: () => ({ connected: false, disabled: true }),
  };
} else {
  const url = process.env.REDIS_URL as string;

  const pub = new Redis(url, { lazyConnect: true });
  const sub = new Redis(url, { lazyConnect: true });

  let connected = false;
  const mark = () => {
    connected = pub.status === "ready" && sub.status === "ready";
  };

  pub.on("ready", mark);
  sub.on("ready", mark);
  pub.on("end", mark);
  sub.on("end", mark);
  pub.on("error", () => {});
  sub.on("error", () => {});

  // parallel verbinden; Fehler werden still geschluckt, Status bleibt false
  (async () => {
    try {
      await Promise.all([pub.connect(), sub.connect()]);
    } catch {
      /* noop */
    }
  })();

  api = {
    async publish(channel, type, data) {
      try {
        await pub.publish(channel, JSON.stringify({ type, data }));
      } catch {
        /* ignore */
      }
    },
    async subscribe(channel, handler) {
      try {
        await sub.subscribe(channel);
        sub.on("message", (ch: string, payload: string) => {
          if (ch !== channel) return;
          try {
            handler(JSON.parse(payload));
          } catch {
            // Fallback: rohen String weitergeben
            handler(payload);
          }
        });
      } catch {
        /* ignore */
      }
    },
    getStatus() {
      return { connected };
    },
  };
}

export default api;
