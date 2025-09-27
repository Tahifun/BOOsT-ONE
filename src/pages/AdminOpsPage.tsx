import React, { useEffect, useState } from "react";

type Metrics = {
  time: string;
  process: {
    pid: number; uptimeSec: number; node: string;
    memory: { rss: number; heapUsed: number; heapTotal: number; external: number };
    loadavg: { ["1m"]: number; ["5m"]: number; ["15m"]: number };
  };
  sse: {
    totalCreators: number;
    totalSubscribers: number;
    bufferCap: number;
    creators: Array<{
      creatorId: string;
      subscribers: number;
      buffers: { chat: number; gifts: number; likes: number; cap: number };
      dropped: { chat: number; gifts: number; likes: number };
      live: boolean;
      lastEventTs?: number;
    }>;
  };
};

const API_BASE = (import.meta as any).env?.VITE_API_URL || "";

const warn = {
  sse: Number((import.meta as any).env?.VITE_WARN_SSE_CONN || 1500),
  mem: Number((import.meta as any).env?.VITE_WARN_MEM_PCT || 0.7),
  buf: Number((import.meta as any).env?.VITE_WARN_BUFFER_PCT || 0.7),
};
const crit = {
  sse: Number((import.meta as any).env?.VITE_CRIT_SSE_CONN || 2500),
  mem: Number((import.meta as any).env?.VITE_CRIT_MEM_PCT || 0.85),
  buf: Number((import.meta as any).env?.VITE_CRIT_BUFFER_PCT || 0.9),
};

function badge(level: "ok"|"warn"|"crit") {
  return level === "crit" ? "bg-red-600" : level === "warn" ? "bg-yellow-500" : "bg-green-600";
}

const AdminOpsPage: React.FC = () => {
  const [m, setM] = useState<Metrics | null>(null);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/admin/metrics`, { credentials: "include" });
        if (r.ok) {
          const j = await r.json();
          if (!stop) setM(j);
        }
      } catch {}
      if (!stop) setTimeout(tick, 10000);
    };
    tick();
    return () => { stop = true; };
  }, []);

  if (!m) return <div className="p-6">Lade Metriken.</div>;

  const heapPct = m.process.memory.heapUsed / (m.process.memory.heapTotal || 1);
  const sse = m.sse.totalSubscribers;

  const sseLevel  = sse > crit.sse ? "crit" : sse > warn.sse ? "warn" : "ok";
  const memLevel  = heapPct > crit.mem ? "crit" : heapPct > warn.mem ? "warn" : "ok";

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin � Live Ops</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded text-white ${badge(sseLevel)}`}>
          <div className="text-sm opacity-90">SSE Connections</div>
          <div className="text-3xl font-bold">{sse}</div>
          <div className="text-xs opacity-90">Warn: {warn.sse} � Krit: {crit.sse}</div>
        </div>
        <div className={`p-4 rounded text-white ${badge(memLevel)}`}>
          <div className="text-sm opacity-90">Heap Usage</div>
          <div className="text-3xl font-bold">{(heapPct*100).toFixed(1)}%</div>
          <div className="text-xs opacity-90">Warn: {(warn.mem*100)}% � Krit: {(crit.mem*100)}%</div>
        </div>
        <div className="p-4 rounded bg-neutral-800 text-white">
          <div className="text-sm opacity-90">Uptime</div>
          <div className="text-3xl font-bold">{Math.round(m.process.uptimeSec/60)} min</div>
          <div className="text-xs opacity-90">PID {m.process.pid} � Node {m.process.node}</div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Creator Buffers</h2>
        <div className="space-y-2">
          {m.sse.creators.map(c => {
            const maxPct = Math.max(
              c.buffers.chat  / c.buffers.cap,
              c.buffers.gifts / c.buffers.cap,
              c.buffers.likes / c.buffers.cap,
            );
            const lvl = maxPct > crit.buf ? "crit" : maxPct > warn.buf ? "warn" : "ok";
            return (
              <div key={c.creatorId} className={`p-3 rounded border ${lvl==="crit"?"border-red-600":lvl==="warn"?"border-yellow-500":"border-neutral-700"}`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{c.creatorId} {c.live ? ". LIVE" : ""}</div>
                  <div className={`px-2 py-0.5 rounded text-white ${badge(lvl)}`}>
                    Buffers {(maxPct*100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-sm opacity-80 mt-1">
                  Subs: {c.subscribers} � Chat {c.buffers.chat}/{c.buffers.cap} (drop {c.dropped.chat}) �
                  Gifts {c.buffers.gifts}/{c.buffers.cap} (drop {c.dropped.gifts}) �
                  Likes {c.buffers.likes}/{c.buffers.cap} (drop {c.dropped.likes})
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default AdminOpsPage;
