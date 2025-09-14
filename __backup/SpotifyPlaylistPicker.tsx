// src/spotify/SpotifyPlaylistPicker.tsx
import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4001";

type Playlist = {
  id: string;
  name: string;
  images?: { url: string }[];
  tracks?: { total: number };
  uri?: string;
};

export default function SpotifyPlaylistPicker() {
  const [items, setItems] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`${API}/api/spotify/me/playlists`, { credentials: "include" });
        const j = await r.json();
        if (!mounted) return;
        const arr: Playlist[] = Array.isArray(j?.items) ? j.items.map((p: unknown) => ({
          id: p.id, name: p.name, images: p.images, tracks: p.tracks, uri: p.uri
        })) : [];
        setItems(arr);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const play = async (uri: string) => {
    await fetch(`${API}/api/spotify/player/play`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ context_uri: uri }),
    });
  };

  if (loading) return <div className="sp-sub">Playlists werden geladen…</div>;
  if (!items.length) return <div className="sp-muted">Keine Playlists gefunden.</div>;

  return (
    <div className="spotify-playlist-picker">
      {items.map(p => (
        <button key={p.id} className="sp-pl-item" onClick={() => play(p.uri || `spotify:playlist:${p.id}`)}>
          {p.images?.[0]?.url && (
            <img src={p.images[0].url} alt="" width={40} height={40} style={{ borderRadius: 6, objectFit: "cover" }} />
          )}
          <div className="sp-pl-text">
            <div className="sp-pl-name">{p.name}</div>
            <div className="sp-pl-sub">{p.tracks?.total ?? 0} Titel</div>
          </div>
          <div className="sp-pl-play">▶</div>
        </button>
      ))}
    </div>
  );
}
