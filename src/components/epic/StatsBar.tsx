// src/components/epic/StatsBar.tsx
type ConnectionQuality = "poor" | "fair" | "good" | "excellent";

interface StreamStats {
  viewers?: number;
  likes?: number;
  gifts?: number;
  streamTime?: number | string; // Sek. oder bereits formatiert
  audioLevel?: number;          // 0..1
  connectionQuality?: ConnectionQuality;

  // optional: Moderation/Queue
  modActions?: number;
  timeouts?: number;
  bans?: number;
  queueSize?: number;
  isRaidMode?: boolean;
  onlineMods?: number;
  moderation?: {
    enabled: boolean;
    activeFilters: string;
    queueSize: number;
    preset: string;
  };
}

interface Props {
  stats?: StreamStats; // darf fehlen → wir rendern trotzdem stabil
}

export function StatsBar({ stats }: Props) {
  // Defensiv normalisieren (verhindert undefined-Zugriffe)
  const safe = {
    viewers: Number.isFinite(stats?.viewers) ? (stats!.viewers as number) : 0,
    likes: Number.isFinite(stats?.likes) ? (stats!.likes as number) : 0,
    gifts: Number.isFinite(stats?.gifts) ? (stats!.gifts as number) : 0,
    streamTime: stats?.streamTime ?? 0,
    audioLevel: Number.isFinite(stats?.audioLevel) ? (stats!.audioLevel as number) : 0,
    connectionQuality: (stats?.connectionQuality ?? "good") as ConnectionQuality,
    moderation: stats?.moderation,
    queueSize: Number.isFinite(stats?.queueSize) ? (stats!.queueSize as number) : undefined,
  };

  const formatStreamTime = (time: number | string): string => {
    if (typeof time === "string") return time;
    const sec = Math.max(0, Math.floor(time));
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = Math.floor(sec % 60);
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      : `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const displayTime = formatStreamTime(safe.streamTime);
  const audioPercentage = Math.min(100, Math.max(0, (safe.audioLevel ?? 0) * 100));

  return (
    <section className="bottom-stats" aria-label="Stream-Statistiken">
      <div className="stat-item">
        <div className="stat-icon" aria-hidden="true">👥</div>
        <div>
          <div className="stat-text">Zuschauer</div>
          <div className="stat-value">{safe.viewers.toLocaleString()}</div>
        </div>
      </div>

      <div className="stat-item">
        <div className="stat-icon" aria-hidden="true">❤️</div>
        <div>
          <div className="stat-text">Likes</div>
          <div className="stat-value">{safe.likes.toLocaleString()}</div>
        </div>
      </div>

      <div className="stat-item">
        <div className="stat-icon" aria-hidden="true">🎁</div>
        <div>
          <div className="stat-text">Geschenke</div>
          <div className="stat-value">{safe.gifts}</div>
        </div>
      </div>

      <div className="stat-item">
        <div className="stat-icon" aria-hidden="true">⏱️</div>
        <div>
          <div className="stat-text">Stream-Zeit</div>
          <div className="stat-value">{displayTime}</div>
        </div>
      </div>

      <div className="stat-item">
        <div className="stat-icon" aria-hidden="true">🎤</div>
        <div>
          <div className="stat-text">Audio</div>
          <div className="stat-value" aria-label={`Audiopegel ${Math.round(audioPercentage)}%`}>
            <div className="audio-meter" style={{ width: `${audioPercentage}%` }} />
          </div>
        </div>
      </div>

      <div className="stat-item">
        <div className="stat-icon" aria-hidden="true">🌐</div>
        <div>
          <div className="stat-text">Verbindung</div>
          <div className={`stat-value connection-${safe.connectionQuality}`}>
            {safe.connectionQuality}
          </div>
        </div>
      </div>

      {safe.moderation && (
        <div className="stat-item">
          <div className="stat-icon" aria-hidden="true">🛡️</div>
          <div>
            <div className="stat-text">Moderation</div>
            <div className="stat-value">
              {safe.moderation.activeFilters || "—"}
              {Number.isFinite(safe.queueSize) ? ` · Queue ${safe.queueSize}` : ""}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default StatsBar;
