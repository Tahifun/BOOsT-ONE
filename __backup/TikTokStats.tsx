import React from "react";

interface TikTokStatsProps {
  variant?: "dashboard" | "overlay";
}

const TikTokStats: React.FC<TikTokStatsProps> = ({ variant = "dashboard" }) => (
  <div className={variant === "overlay" ? "overlay-widget" : "dashboard-feature"}>
    <h2 className={variant === "overlay" ? "overlay-title" : undefined}>
      TikTok-Statistik
    </h2>
    <p>
      {variant === "overlay"
        ? "Live-Analyse deiner TikTok-Daten im Stream-Overlay."
        : "Analyse deiner TikTok-Livestream-Daten."}
    </p>
  </div>
);

export default TikTokStats;
