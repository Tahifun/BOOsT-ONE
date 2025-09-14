import React from "react";

interface ChatPeakGraphProps {
  variant?: "dashboard" | "overlay";
}

const ChatPeakGraph: React.FC<ChatPeakGraphProps> = ({ variant = "dashboard" }) => (
  <div className={variant === "overlay" ? "overlay-widget" : "dashboard-feature"}>
    <h2 className={variant === "overlay" ? "overlay-title" : undefined}>
      Chat Peaks
    </h2>
    <p>
      {variant === "overlay"
        ? "Spitzenwerte im Chat (Overlay-Ansicht)."
        : "Hier werden Spitzenwerte und Hochphasen im Chatverlauf visualisiert."}
    </p>
  </div>
);

export default ChatPeakGraph;
