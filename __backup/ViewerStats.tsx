import React from "react";

interface ViewerStatsProps {
  variant?: "dashboard" | "overlay";
}

const ViewerStats: React.FC<ViewerStatsProps> = ({ variant = "dashboard" }) => (
  <div className={variant === "overlay" ? "overlay-widget" : "dashboard-feature"}>
    <h2 className={variant === "overlay" ? "overlay-title" : undefined}>
      Zuschauer-Statistik
    </h2>
    <p>
      {variant === "overlay"
        ? "Live-Zuschauerzahlen für dein Stream-Overlay."
        : "Hier werden die Zuschauerzahlen deines Streams angezeigt."}
    </p>
    {/* Hier später die echte Statistik */}
  </div>
);

export default ViewerStats;
