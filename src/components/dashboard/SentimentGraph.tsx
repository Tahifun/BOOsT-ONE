import React from "react";

interface SentimentGraphProps {
  variant?: "dashboard" | "overlay";
}

const SentimentGraph: React.FC<SentimentGraphProps> = ({ variant = "dashboard" }) => (
  <div className={variant === "overlay" ? "overlay-widget" : "dashboard-feature"}>
    <h2 className={variant === "overlay" ? "overlay-title" : undefined}>
      Stimmung im Chat
    </h2>
    <p>
      {variant === "overlay"
        ? "Chat-Stimmung live im Overlay."
        : "Hier siehst du die aktuelle Stimmung in deinem Livestream-Chat."}
    </p>
  </div>
);

export default SentimentGraph;
