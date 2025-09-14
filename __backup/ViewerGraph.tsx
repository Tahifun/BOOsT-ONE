import React from "react";

interface ViewerGraphProps {
  variant?: "dashboard" | "overlay";
}

const ViewerGraph: React.FC<ViewerGraphProps> = ({ variant = "dashboard" }) => (
  <div className={variant === "overlay" ? "overlay-widget" : "dashboard-feature"}>
    <h2 className={variant === "overlay" ? "overlay-title" : undefined}>
      Zuschauer-Verlauf
    </h2>
    <p>
      {variant === "overlay"
        ? "Live-Grafik der Zuschauerentwicklung für dein Overlay."
        : "Grafische Darstellung der Zuschauerentwicklung."}
    </p>
  </div>
);

export default ViewerGraph;
