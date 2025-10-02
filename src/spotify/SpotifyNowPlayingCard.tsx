// src/spotify/SpotifyNowPlayingCard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { getNowPlaying } from '../services/spotifyService';
import "../styles/spotify.css";

type Track = {
  title?: string;
  artist?: string;
  album?: string;
  albumArtUrl?: string;
  trackUrl?: string;
  durationMs?: number;
  progressMs?: number;
};

type TrackState =
  | { isPlaying: false }
  | { isPlaying: true; track: Track | null }; // <- track darf null sein (Backend-Realitt)

const POLL_MS = 15000;

/** type guard */
function hasTrack(d: TrackState | null): d is { isPlaying: true; track: Track } {
  return !!d && d.isPlaying === true && !!(d as any).track;
}

/** defensiv normalisieren, egal wie das Backend antwortet */
function normalize(res: unknown): TrackState {
  if (!res || res.isPlaying !== true) return { isPlaying: false };

  const t = res.track ?? null;
  if (!t || typeof t !== "object") return { isPlaying: false };

  const durationMs =
    Number.isFinite(t.durationMs) ? Number(t.durationMs) :
    Number.isFinite(t.duration_ms) ? Number(t.duration_ms) :
    undefined;

  const progressMs =
    Number.isFinite(res.progressMs) ? Number(res.progressMs) :
    Number.isFinite(res.progress_ms) ? Number(res.progress_ms) :
    undefined;

  return {
    isPlaying: true,
    track: {
      title: t.title ?? t.name ?? "",
      artist: Array.isArray(t.artists) ? t.artists.join(", ") : (t.artist ?? ""),
      album: t.album ?? t.albumName ?? undefined,
      albumArtUrl: t.albumArtUrl ?? t.artworkUrl ?? t.image ?? undefined,
      trackUrl: t.trackUrl ?? t.url ?? undefined,
      durationMs,
      progressMs,
    },
  };
}

const SpotifyNowPlayingCard: React.FC = () => {
  const [data, setData] = useState<TrackState | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const pct = useMemo(() => {
    if (!hasTrack(data)) return 0;
    const d = Number(data.track.durationMs ?? 0);
    const p = Number(data.track.progressMs ?? 0);
    if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(p) || p < 0) return 0;
    return Math.round(Math.max(0, Math.min(1, p / d)) * 100);
  }, [data]);

  useEffect(() => {
    let mounted = true;
    let timer: number | undefined;

    const load = async () => {
      try {
        const res = await getNowPlaying(); // darf null liefern
        if (!mounted) return;

        // null/kaputter Response  nichts luft
        setData(res ? normalize(res) : { isPlaying: false });
        setErr(null);
      } catch (e: unknown) {
        if (!mounted) return;
        setErr(e?.message || "Now Playing konnte nicht geladen werden.");
        setData({ isPlaying: false });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    timer = window.setInterval(load, POLL_MS);

    return () => {
      mounted = false;
      if (timer) window.clearInterval(timer);
    };
  }, []);

  return (
    <div className={`spotify-now-card${loading ? " is-loading" : ""}`} aria-live="polite">
      <div className="sp-header">
        <div className="sp-badge" aria-hidden title="Spotify"></div>
        <h3 style={{ margin: 0, fontWeight: 600 }}>Now Playing</h3>
      </div>

      {loading && (
        <div className="np-row" aria-hidden>
          <div className="sp-skeleton" style={{ width: 56, height: 56, borderRadius: 8 }} />
          <div style={{ flex: 1 }}>
            <div className="sp-skeleton" style={{ height: 14, width: "80%", borderRadius: 6 }} />
            <div className="sp-skeleton" style={{ height: 12, width: "50%", marginTop: 8, borderRadius: 6 }} />
            <div className="sp-skeleton" style={{ height: 6, width: "100%", marginTop: 12, borderRadius: 6 }} />
          </div>
        </div>
      )}

      {!loading && err && <div className="sp-error" role="alert">{err}</div>}

      {!loading && !err && hasTrack(data) && (
        <div className="np-row">
          {data.track.albumArtUrl ? (
            <img
              src={data.track.albumArtUrl}
              alt="Album Cover"
              className="np-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />
          ) : (
            <div className="np-cover np-cover--placeholder"></div>
          )}

          <div style={{ minWidth: 0, width: "100%" }}>
            <div className="np-title" title={data.track.title || ""}>
              {data.track.title || "Unbekannter Titel"}
            </div>
            <div className="np-artist" title={data.track.artist || ""}>
              {(data.track.artist || "Unbekannter Artist") +
                (data.track.album ? `  ${data.track.album}` : "")}
            </div>

            <div className="np-progress" aria-label="Fortschritt">
              <span style={{ width: `${pct}%` }} />
            </div>

            {data.track.trackUrl && (
              <a href={data.track.trackUrl} target="_blank" rel="noreferrer" className="sp-link">
                In Spotify ffnen 
              </a>
            )}
          </div>
        </div>
      )}

      {!loading && !err && !hasTrack(data) && (
        <div className="sp-muted">Es luft gerade nichts.</div>
      )}
    </div>
  );
};

export default SpotifyNowPlayingCard;

