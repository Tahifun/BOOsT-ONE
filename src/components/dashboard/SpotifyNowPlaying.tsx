import React from "react";

interface SpotifyNowPlayingProps {
  variant?: "dashboard" | "overlay";
}

const SpotifyNowPlaying: React.FC<SpotifyNowPlayingProps> = ({ variant = "dashboard" }) => (
  <div className={variant === "overlay" ? "overlay-widget" : "dashboard-feature"}>
    <h2 className={variant === "overlay" ? "overlay-title" : undefined}>
      Spotify Now Playing
    </h2>
    <p>
      {variant === "overlay"
        ? "Gerade laufender Song (Overlay-Ansicht)."
        : "Zeigt den aktuell auf Spotify laufenden Song."}
    </p>
  </div>
);

export default SpotifyNowPlaying;
