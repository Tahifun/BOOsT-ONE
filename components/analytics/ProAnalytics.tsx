// src/components/analytics/ProAnalytics.tsx
import React, { useEffect, useMemo, useState } from "react";
import ProFeatureWrapper from '../common/ProFeatureWrapper';
import { useSubscription } from '../../contexts/SubscriptionContext';
import "@/styles/overlay/ProAnalytics.css";

/* ===========================
   Typen
   =========================== */
type Point = { t: string; v: number }; // t = ISO/Label, v = value

type ProStats = {
  peakViewers: number;
  avgViewers: number;
  newFollowers: number;
  coins: number;
  chatMessages: number;
  engagementRate: number; // 0..1
  viewersSeries: Point[];
  followersSeries: Point[];
  coinsSeries: Point[];
};

type RangeKey = "7d" | "30d" | "90d";

/* ===========================
   Helpers
   =========================== */
const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

const RANGES: Record<RangeKey, { label: string; days: number }> = {
  "7d": { label: "7 Tage", days: 7 },
  "30d": { label: "30 Tage", days: 30 },
  "90d": { label: "90 Tage", days: 90 },
};

function fmt(num: number) {
  return new Intl.NumberFormat("de-DE").format(num);
}
function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}
function toCSV(stats: ProStats): string {
  const header = "metric,value\n";
  const rows = [
    ["peakViewers", stats.peakViewers],
    ["avgViewers", stats.avgViewers],
    ["newFollowers", stats.newFollowers],
    ["coins", stats.coins],
    ["chatMessages", stats.chatMessages],
    ["engagementRate", stats.engagementRate],
  ]
    .map(([k, v]) => `${k},${v}`)
    .join("\n");
  const viewers = ["\n\nviewersSeries_t,viewersSeries_v"]
    .concat(stats.viewersSeries.map((p) => `${p.t},${p.v}`))
    .join("\n");
  const followers = ["\n\nfollowersSeries_t,followersSeries_v"]
    .concat(stats.followersSeries.map((p) => `${p.t},${p.v}`))
    .join("\n");
  const coins = ["\n\ncoinsSeries_t,coinsSeries_v"]
    .concat(stats.coinsSeries.map((p) => `${p.t},${p.v}`))
    .join("\n");
  return header + rows + viewers + followers + coins;
}
function download(name: string, data: string, mime = "text/csv") {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* Minimaler Sparkline-Renderer (SVG) */
const Sparkline: React.FC<{ data: Point[]; w?: number; h?: number; title?: string }> = ({
  data,
  w = 220,
  h = 56,
  title,
}) => {
  const path = useMemo(() => {
    if (!data?.length) return "";
    const xs = data.map((_, i) => i);
    const ys = data.map((p) => p.v);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const range = Math.max(1, max - min);
    const px = (i: number) => (i / Math.max(1, xs.length - 1)) * (w - 2) + 1;
    const py = (v: number) => h - 2 - ((v - min) / range) * (h - 4);
    return data.map((p, i) => `${i === 0 ? "M" : "L"} ${px(i)},${py(p.v)}`).join(" ");
  }, [data, w, h]);

  const last = data?.[data.length - 1]?.v ?? 0;
  const first = data?.[0]?.v ?? 0;
  const up = last >= first;

  return (
    <svg width={w} height={h} role="img" aria-label={title || "Zeitreihe"}>
      <title>{title}</title>
      <rect x="0" y="0" width={w} height={h} rx="8" ry="8" fill="rgba(255,255,255,0.04)" />
      {/* Linie */}
      <path d={path} fill="none" stroke={up ? "#18ffe6" : "#ff7aa2"} strokeWidth="2" />
      {/* Punkt zuletzt */}
      {data?.length ? (
        <circle
          cx={((data.length - 1) / Math.max(1, data.length - 1)) * (w - 2) + 1}
          cy={(() => {
            const ys = data.map((p) => p.v);
            const min = Math.min(...ys);
            const max = Math.max(...ys);
            const range = Math.max(1, max - min);
            return h - 2 - ((last - min) / range) * (h - 4);
          })()}
          r="3.5"
          fill={up ? "#18ffe6" : "#ff7aa2"}
          stroke="rgba(0,0,0,.35)"
        />
      ) : null}
    </svg>
  );
};

/* ===========================
   Datenbeschaffung (fehlertolerant)
   =========================== */
async function fetchProStats(days: number): Promise<ProStats> {
  // Versuche bevorzugte Route; fallback auf alternative; am Ende Mock
  const routes = [
    `${API_BASE}/stats/pro-analytics?days=${days}`,
    `${API_BASE}/stats/overview?days=${days}`,
  ];

  for (const url of routes) {
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) continue;
      const j = await res.json();

      // Versuche flexibel zu mappen, damit Backend frei bleiben kann:
      const stats: ProStats = {
        peakViewers: j.peakViewers ?? j.viewersPeak ?? 0,
        avgViewers: j.avgViewers ?? j.viewersAvg ?? 0,
        newFollowers: j.newFollowers ?? j.followersNew ?? 0,
        coins: j.coins ?? j.earnedCoins ?? 0,
        chatMessages: j.chatMessages ?? j.messages ?? 0,
        engagementRate: j.engagementRate ?? j.engagement ?? 0,
        viewersSeries: (j.viewersSeries ?? j.seriesViewers ?? []).map((p: unknown) => ({
          t: p.t ?? p.time ?? p.date ?? "",
          v: p.v ?? p.value ?? 0,
        })),
        followersSeries: (j.followersSeries ?? j.seriesFollowers ?? []).map((p: unknown) => ({
          t: p.t ?? p.time ?? p.date ?? "",
          v: p.v ?? p.value ?? 0,
        })),
        coinsSeries: (j.coinsSeries ?? j.seriesCoins ?? []).map((p: unknown) => ({
          t: p.t ?? p.time ?? p.date ?? "",
          v: p.v ?? p.value ?? 0,
        })),
      };
      return stats;
    } catch {
      // n�chsten Versuch
    }
  }

  // Mockdaten als Fallback (Offline/Backend fehlt)
  const mk = (n: number, base: number, jitter: number): Point[] =>
    Array.from({ length: n }, (_, i) => ({
      t: `T${i + 1}`,
      v: Math.max(0, Math.round(base + (Math.sin(i / 2) * jitter + (Math.random() - 0.5) * jitter))),
    }));

  return {
    peakViewers: 142,
    avgViewers: 88,
    newFollowers: 63,
    coins: 1180,
    chatMessages: 940,
    engagementRate: 0.23,
    viewersSeries: mk(days, 90, 40),
    followersSeries: mk(days, 6, 4),
    coinsSeries: mk(days, 120, 80),
  };
}

/* ===========================
   Komponente
   =========================== */
const ProAnalytics: React.FC = () => {
  const { tier, active } = useSubscription();
  const isPro = tier !== "FREE" && active;

  const [range, setRange] = useState<RangeKey>("7d");
  const [stats, setStats] = useState<ProStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    fetchProStats(RANGES[range].days)
      .then((s) => alive && setStats(s))
      .catch((e) => alive && setErr(e?.message || "Fehler beim Laden"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [range]);

  const handleExportCSV = () => {
    if (!stats) return;
    const csv = toCSV(stats);
    download(`pro-analytics_${range}.csv`, csv, "text/csv;charset=utf-8");
  };

  return (
    <ProFeatureWrapper featureName="pro_analytics">
      <div className="overlay-widget-card" role="region" aria-label="Pro Analytics">
        <div className="widget-icon"></div>
        <div className="widget-title">Pro Analytics</div>
        <div className="widget-desc" style={{ marginBottom: 10 }}>
          Tiefere Einblicke in Zuschauer, Follows, Coins & Chat  mit Vergleich �ber Zeit.
        </div>

        {/* Range-Auswahl */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 8 }}>
          {(Object.keys(RANGES) as RangeKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setRange(k)}
              className={range === k ? "active" : ""}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: range === k ? "linear-gradient(90deg,#21ffd9,#1979f8)" : "linear-gradient(90deg,#22e5ff,#18bbd0)",
                color: "#012",
                fontWeight: 800,
                boxShadow: "0 0 12px rgba(11,213,248,.28)",
              }}
            >
              {RANGES[k].label}
            </button>
          ))}

          {/* CSV-Export separat pro Feature gate'n */}
          <ProFeatureWrapper featureName="stats_export" showUpgradePrompt>
            <button
              onClick={handleExportCSV}
              disabled={!stats || loading}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(90deg,#16f2ff,#28ffe6)",
                color: "#003131",
                fontWeight: 900,
                boxShadow: "0 2px 12px rgba(9,255,251,.4)",
              }}
              title="Als CSV exportieren"
            >
               Export CSV
            </button>
          </ProFeatureWrapper>
        </div>

        {/* Fehler */}
        {err && (
          <div
            style={{
              margin: "6px 0 10px 0",
              color: "#ffd5db",
              background: "linear-gradient(90deg,#3a001080,#002a2a60)",
              padding: "8px 10px",
              borderRadius: 10,
              fontWeight: 700,
            }}
          >
            {err}
          </div>
        )}

        {/* Kennzahlen */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 12,
            width: "100%",
            marginTop: 8,
          }}
        >
          <MetricCard label="Peak Viewers" value={stats ? fmt(stats.peakViewers) : ""} loading={loading} />
          <MetricCard label=" Viewers" value={stats ? fmt(stats.avgViewers) : ""} loading={loading} />
          <MetricCard label="Neue Follower" value={stats ? fmt(stats.newFollowers) : ""} loading={loading} />
          <MetricCard label="Coins" value={stats ? fmt(stats.coins) : ""} loading={loading} />
          <MetricCard label="Chat-Nachrichten" value={stats ? fmt(stats.chatMessages) : ""} loading={loading} />
          <MetricCard label="Engagement" value={stats ? pct(stats.engagementRate) : ""} loading={loading} />
        </div>

        {/* Sparklines */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 16,
            width: "100%",
            marginTop: 12,
          }}
        >
          <SeriesCard title="Zuschauer-Verlauf" data={stats?.viewersSeries || []} loading={loading} />
          <SeriesCard title="Follower-Zuwachs" data={stats?.followersSeries || []} loading={loading} />
          <SeriesCard title="Coins-Entwicklung" data={stats?.coinsSeries || []} loading={loading} />
        </div>
      </div>
    </ProFeatureWrapper>
  );
};

/* Kleine UI-Bausteine */
const MetricCard: React.FC<{ label: string; value: string; loading?: boolean }> = ({ label, value, loading }) => (
  <div
    className="overlay-widget-card"
    style={{ padding: 14, alignItems: "flex-start", gap: 4, minHeight: 80 }}
    aria-busy={loading || undefined}
  >
    <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 900, color: "#18ffe6", textShadow: "0 0 8px #18ffe666" }}>
      {loading ? "" : value}
    </div>
  </div>
);

const SeriesCard: React.FC<{ title: string; data: Point[]; loading?: boolean }> = ({ title, data, loading }) => (
  <div className="overlay-widget-card" style={{ padding: 14 }}>
    <div className="widget-title" style={{ fontSize: 16, marginBottom: 6, textAlign: "left" }}>
      {title}
    </div>
    {loading ? (
      <div style={{ opacity: 0.8 }}>Lade </div>
    ) : data?.length ? (
      <Sparkline data={data} title={title} />
    ) : (
      <div style={{ opacity: 0.8 }}>Keine Daten im Zeitraum</div>
    )}
  </div>
);

export default ProAnalytics;

