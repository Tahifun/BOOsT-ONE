// src/spotify/SpotifyControls.tsx
import React, { useEffect, useState } from "react";
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

const API = import.meta.env.VITE_API_URL || "http://localhost:4001";

export default function SpotifyControls() {
  // Dein Hook liefert: { deviceId, ready, player }
  const { deviceId, ready } = useSpotifyPlayer();
  const [playlistUrl, setPlaylistUrl] = useState("");

  // Browser-Device nach "ready" als aktives Gerät übernehmen (kein Autoplay)
  useEffect(() => {
    if (!ready || !deviceId) return;
    fetch(`${API}/api/spotify/player/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ device_id: deviceId, play: false }),
    }).catch(() => {});
  }, [ready, deviceId]);

  // URL/URI -> context_uri
  const extractContextUri = (input: string) => {
    const s = input.trim();
    if (!s) return "";
    if (s.startsWith("spotify:")) return s; // z.B. spotify:playlist:ID
    try {
      const u = new URL(s);
      if (u.hostname.includes("spotify") && u.pathname.startsWith("/playlist/")) {
        const id = u.pathname.split("/")[2];
        return `spotify:playlist:${id}`;
      }
    } catch {/* ignore */}
    return s;
  };

  const handlePlay = async () => {
    const context_uri = extractContextUri(playlistUrl);
    if (!context_uri) return;

    await fetch(`${API}/api/spotify/player/play`, {
      method: "POST", // unser Backend erwartet POST
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ context_uri }),
    });
  };

  const handlePause = async () => {
    await fetch(`${API}/api/spotify/player/pause`, {
      method: "PUT",
      credentials: "include",
    });
  };

  const handleResume = async () => {
    await fetch(`${API}/api/spotify/player/play`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}), // resume
    });
  };

  const handleNext = async () => {
    await fetch(`${API}/api/spotify/player/next`, {
      method: "POST",
      credentials: "include",
    });
  };

  const handlePrev = async () => {
    await fetch(`${API}/api/spotify/player/previous`, {
      method: "POST",
      credentials: "include",
    });
  };

  return (
    <div className="spotify-controls">
      <div className="row" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          placeholder="Playlist-URL oder spotify:playlist:ID"
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          style={{ flex: 1 }}
        />
        <button disabled={!ready || !deviceId} onClick={handlePlay}>Play �-�</button>
        <button onClick={handlePause}>Pause ⏸</button>
        <button onClick={handleResume}>Resume ⏯</button>
        <button onClick={handlePrev}>⏮</button>
        <button onClick={handleNext}>⏭</button>
      </div>

      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
        {!ready || !deviceId ? (
          <span>Initialisiere Spotify Player�?�</span>
        ) : (
          <span>Player bereit �?" Device: {deviceId}</span>
        )}
      </div>
    </div>
  );
}

