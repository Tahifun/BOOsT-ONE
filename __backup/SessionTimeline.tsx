import React from "react";

interface SessionTimelineProps {
  variant?: "dashboard" | "overlay";
}

const SessionTimeline: React.FC<SessionTimelineProps> = ({ variant = "dashboard" }) => (
  <div className={variant === "overlay" ? "overlay-widget" : "dashboard-feature"}>
    <h2 className={variant === "overlay" ? "overlay-title" : undefined}>
      Session Timeline
    </h2>
    <p>
      {variant === "overlay"
        ? "Streaming-Sessions im zeitlichen Verlauf (Overlay)."
        : "Deine Streaming-Sessions im zeitlichen Verlauf."}
    </p>
  </div>
);

export default SessionTimeline;
