import React, { useEffect, useState } from "react";
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

const API =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:4001`;

type PlayerState = {
  is_playing?: boolean;
  item?: {
    name?: string;
    uri?: string;
    duration_ms?: number;
    artists?: { name: string }[];
    album?: { images?: { url: string }[] };
  };
  progress_ms?: number;
};

export default function SpotifyControlCard() {
  const { ready } = useSpotifyPlayer();
  const [state, setState] = useState<PlayerState | null>(null);
  const [loading, setLoading] = useState(true);

  // Zustand pollen
  useEffect(() => {
    let t: number | undefined;
    const pull = async () => {
      try {
        const r = await fetch(`${API}/api/spotify/player/state`, { credentials: "include" });
        if (r.ok) {
          const j = await r.json();
          setState(j || null);
        }
      } catch {}
    };
    pull();
    t = window.setInterval(pull, 3000);
    return () => t && clearInterval(t);
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [ready]);

  const action = (path: string, method = "POST", body?: unknown) =>
    fetch(`${API}/api/spotify/${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).catch(() => {});

  const playPause = async () => {
    if (state?.is_playing) {
      await action("player/pause", "PUT");
    } else {
      await action("player/play", "PUT", {}); // resume last context
    }
  };

  const next = () => action("player/next");
  const prev = () => action("player/previous");

  const img = state?.item?.album?.images?.[0]?.url;
  const title = state?.item?.name || "";
  const artists = (state?.item?.artists || []).map(a => a.name).join(", ") || "";

  return (
    <div id="spotify-card" style={{ background:"#141414", borderRadius:12, padding:16 }}>
      <div style={{ display:"flex", gap:16 }}>
        {img ? (
          <img src={img} alt="" style={{ width:96, height:96, objectFit:"cover", borderRadius:8 }} />
        ) : (
          <div style={{ width:96, height:96, borderRadius:8, background:"#222" }} />
        )}

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ opacity:0.7, fontSize:12, marginBottom:4 }}>Jetzt luft</div>
          <div style={{ fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {title}
          </div>
          <div style={{ opacity:0.8, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {artists}
          </div>

          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button disabled={!ready || loading} onClick={prev}  style={btn()}>?</button>
            <button disabled={!ready || loading} onClick={playPause} style={btn(true)}>
              {state?.is_playing ? "? Pause" : " Play"}
            </button>
            <button disabled={!ready || loading} onClick={next}  style={btn()}>?</button>
          </div>
          {!ready && <div style={{ marginTop:8, fontSize:12, opacity:0.7 }}>Player initialisiert</div>}
        </div>
      </div>
    </div>
  );
}

function btn(primary = false): React.CSSProperties {
  return {
    padding:"8px 12px",
    borderRadius:8,
    border:0,
    background: primary ? "#1DB954" : "#2a2a2a",
    color:"#fff",
    cursor:"pointer"
  };
}

