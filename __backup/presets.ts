export type RaidGuardLevel = "off" | "low" | "medium" | "max";
export type LinkMode =
  | "allow_all"
  | "allow_with_blacklist"
  | "trusted_only"
  | "review_trusted_only"
  | "block_all";
export type ToxicAction = "warn" | "timeout_30s" | "timeout_5m" | "ban";

export interface ModerationSettings {
  spam: { enabled: boolean; maxRepeats: number };
  caps: { enabled: boolean; threshold: number };         // 0..100
  links: { mode: LinkMode };
  toxicity: { enabled: boolean; threshold: number; action: ToxicAction }; // 0..1
  slowModeSec: number;
  followerOnly: boolean;
  raidGuard: RaidGuardLevel;
}

export const PRESETS: Record<
  "chill" | "balanced" | "party" | "lockdown",
  ModerationSettings
> = {
  chill: {
    spam: { enabled: false, maxRepeats: 7 },
    caps: { enabled: false, threshold: 92 },
    links: { mode: "allow_with_blacklist" },
    toxicity: { enabled: true, threshold: 0.95, action: "warn" },
    slowModeSec: 0,
    followerOnly: false,
    raidGuard: "low",
  },
  balanced: {
    spam: { enabled: true, maxRepeats: 3 },
    caps: { enabled: true, threshold: 75 },
    links: { mode: "review_trusted_only" },
    toxicity: { enabled: true, threshold: 0.85, action: "timeout_30s" },
    slowModeSec: 2,
    followerOnly: false,
    raidGuard: "medium",
  },
  party: {
    spam: { enabled: true, maxRepeats: 5 },
    caps: { enabled: false, threshold: 90 },
    links: { mode: "trusted_only" },
    toxicity: { enabled: true, threshold: 0.9, action: "warn" },
    slowModeSec: 0,
    followerOnly: false,
    raidGuard: "low",
  },
  lockdown: {
    spam: { enabled: true, maxRepeats: 2 },
    caps: { enabled: true, threshold: 55 },
    links: { mode: "block_all" },
    toxicity: { enabled: true, threshold: 0.7, action: "timeout_5m" },
    slowModeSec: 15,
    followerOnly: true,
    raidGuard: "max",
  },
};
