import React from "react";

interface CoinStatsProps {
  variant?: "dashboard" | "overlay";
}

const CoinStats: React.FC<CoinStatsProps> = ({ variant = "dashboard" }) => (
  <div className={variant === "overlay" ? "overlay-widget" : "dashboard-feature"}>
    <h2 className={variant === "overlay" ? "overlay-title" : undefined}>
      Coin-Statistik
    </h2>
    <p>
      {variant === "overlay"
        ? "Live-�bersicht deiner verdienten Coins (Overlay-Ansicht)."
        : "Hier findest du eine �bersicht deiner verdienten Coins."}
    </p>
  </div>
);

export default CoinStats;
