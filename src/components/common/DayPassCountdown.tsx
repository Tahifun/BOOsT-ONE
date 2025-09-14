// src/components/common/DayPassCountdown.tsx
import React from "react";
import { Clock } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

export interface DayPassCountdownProps {
  prefix?: React.ReactNode;
  className?: string;
}

function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const DayPassCountdown: React.FC<DayPassCountdownProps> = ({ prefix, className }) => {
  const { isDayPass, msRemaining } = useSubscription();
  if (!isDayPass || msRemaining == null) return null;
  return (
    <span className={className ?? "daypass-countdown"} title="Day-Pass Restzeit">
      {prefix ?? <Clock size={12} style={{ marginRight: 4 }} />}{formatHMS(msRemaining)}
    </span>
  );
};

export default DayPassCountdown;
