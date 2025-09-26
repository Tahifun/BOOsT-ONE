// src/pages/SpotifyPage.tsx
import React from "react";
import SpotifyPlaylists from '../spotify/SpotifyPlaylists';

export default function SpotifyPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Spotify Playlists</h1>
      <SpotifyPlaylists />
    </div>
  );
}

