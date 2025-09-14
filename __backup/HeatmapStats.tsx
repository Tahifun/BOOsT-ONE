import React from "react";

interface HeatmapStatsProps {
  variant?: "dashboard" | "overlay";
}

const HeatmapStats: React.FC<HeatmapStatsProps> = ({ variant = "dashboard" }) => (
  <div className={variant === "overlay" ? "overlay-widget" : "dashboard-feature"}>
    <h2 className={variant === "overlay" ? "overlay-title" : undefined}>
      Heatmap
    </h2>
    <p>
      {variant === "overlay"
        ? "Heatmap deines Streams (Overlay)."
        : "Hier siehst du, wann und wie viel in deinem Stream los war."}
    </p>
  </div>
);

export default HeatmapStats;
