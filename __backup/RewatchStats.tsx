import React from "react";

interface RewatchStatsProps {
  variant?: "dashboard" | "overlay";
}

const RewatchStats: React.FC<RewatchStatsProps> = ({ variant = "dashboard" }) => (
  <div className={variant === "overlay" ? "overlay-widget" : "dashboard-feature"}>
    <h2 className={variant === "overlay" ? "overlay-title" : undefined}>
      Rewatch Stats
    </h2>
    <p>
      {variant === "overlay"
        ? "Statistik zum erneuten Ansehen (Overlay)."
        : "Statistik zum erneuten Ansehen deiner Streams."}
    </p>
  </div>
);

export default RewatchStats;
