import React, { useEffect, useState } from "react";
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

const API =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:4001`;

type Playlist = {
  id: string;
  name: string;
  images?: { url: string }[];
  uri: string;
  tracks?: { total: number };
};

export default function SpotifyPlaylists() {
  const { ready } = useSpotifyPlayer();
  const [items, setItems] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await fetch(`${API}/api/spotify/me/playlists`, { credentials: "include" });
      const j = await r.json();
      setItems(j.items || []);
      setLoading(false);
    })();
  }, []);

  const playPlaylist = async (pl: Playlist) => {
    await fetch(`${API}/api/spotify/player/play`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context_uri: pl.uri }),
    });
  };

  if (loading) return <div>Playlists ladenâ€¦</div>;

  return (
    <div style={{ display:"grid", gap:16, gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))" }}>
      {items.map(pl => (
        <div key={pl.id} style={{ background:"#141414", padding:16, borderRadius:12 }}>
          {pl.images?.[0]?.url && (
            <img src={pl.images[0].url} alt={pl.name} style={{ width:"100%", borderRadius:8, marginBottom:8 }} />
          )}
          <div style={{ fontWeight:600, marginBottom:4 }}>{pl.name}</div>
          <div style={{ fontSize:12, opacity:0.7, marginBottom:8 }}>{pl.tracks?.total ?? 0} Titel</div>
          <button
            disabled={!ready}
            onClick={() => playPlaylist(pl)}
            style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:0, background: ready ? "#1DB954" : "#555", color:"#fff" }}
          >
            â–¶ï¸Ž Abspielen
          </button>
        </div>
      ))}
    </div>
  );
}

