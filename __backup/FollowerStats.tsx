import React from "react";

interface FollowerStatsProps {
  variant?: "dashboard" | "overlay";
}

const FollowerStats: React.FC<FollowerStatsProps> = ({ variant = "dashboard" }) => (
  <div className={variant === "overlay" ? "overlay-widget" : "dashboard-feature"}>
    <h2 className={variant === "overlay" ? "overlay-title" : undefined}>
      Follower-Statistik
    </h2>
    <p>
      {variant === "overlay"
        ? "Aktuelle & neue Follower im Overlay."
        : "Hier werden alle aktuellen und neuen Follower angezeigt."}
    </p>
  </div>
);

export default FollowerStats;
