import React from "react";

interface FollowerTrendProps {
  variant?: "dashboard" | "overlay";
}

const FollowerTrend: React.FC<FollowerTrendProps> = ({ variant = "dashboard" }) => (
  <div className={variant === "overlay" ? "overlay-widget" : "dashboard-feature"}>
    <h2 className={variant === "overlay" ? "overlay-title" : undefined}>
      Follower-Verlauf
    </h2>
    <p>
      {variant === "overlay"
        ? "Grafik: Followerentwicklung im Overlay."
        : "Grafische Darstellung der Followerentwicklung."}
    </p>
  </div>
);

export default FollowerTrend;
