import React from "react";
import { Crown, Lock, Clock } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import "@/styles/TierUI.css";

export interface TierBadgeProps {
  className?: string;
  showCountdown?: boolean;
  variant?: "inline" | "chip";
}

function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const TierBadge: React.FC<TierBadgeProps> = ({ className, showCountdown = true, variant = "inline" }) => {
  const { isPro, isDayPass, msRemaining } = useSubscription();

  const baseStyle: React.CSSProperties =
    variant === "chip"
      ? { border: "1px solid var(--border, #222)", padding: "4px 8px", borderRadius: 8 }
      : {};

  if (isPro) {
    return (
      <div className={`tier-badge pro ${className ?? ""}`} title={isDayPass ? "Day‑Pass aktiv" : "PRO aktiv"} style={baseStyle}>
        <Crown size={12} />
        <span style={{ marginLeft: 6 }}>{isDayPass ? "PRO (Day‑Pass)" : "PRO"}</span>
        {isDayPass && showCountdown && msRemaining !== null && (
          <span className="badge-countdown" style={{ marginLeft: 8 }}>
            <Clock size={12} style={{ marginRight: 4 }} />
            {formatHMS(msRemaining)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`tier-badge free ${className ?? ""}`} title="Free" style={baseStyle}>
      <Lock size={12} />
      <span style={{ marginLeft: 6 }}>Free</span>
    </div>
  );
};

export default TierBadge;