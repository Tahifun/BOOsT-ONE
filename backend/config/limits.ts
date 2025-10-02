// backend/config/limits.ts
// Zentrale Free/Pro-Limits (Gre, Anzahl, Quoten) + Helper

export type TierName = "FREE" | "PRO" | "ENTERPRISE";

export interface Limits {
  /** Max. Anzahl Overlay-Vorlagen */
  templatesMax: number;
  /** Max. Uploadgre in Bytes (fr /media/upload u..) */
  uploadMaxBytes: number;
  /** Gleichzeitige Ressourcennutzung */
  concurrent: {
    uploads: number;      // gleichzeitige Uploads
    recordings: number;   // parallele Recordings
    transcodes: number;   // parallele Transcodings
  };
  /** Quoten/Feature-Toggles (optional) */
  features: {
    aiModeration: boolean;
    multistream: boolean;
    statsExport: boolean; // CSV-Export
  };
  quotas: {
    dailyExports: number; // CSV-Exports / Tag
  };
}

/* ===== Helpers ===== */
const MB = (n: number) => Math.max(0, Math.floor(n * 1024 * 1024));
const envInt = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
};

/**
 * Default-Limits (knnen via ENV berschrieben werden)
 * ENV-Keys:
 *  - LIMIT_TEMPLATES_FREE / _PRO / _ENT
 *  - LIMIT_UPLOAD_FREE_MB / _PRO_MB / _ENT_MB
 *  - LIMIT_CONCURRENT_UPLOADS_* , LIMIT_CONCURRENT_RECORDINGS_* , LIMIT_CONCURRENT_TRANSCODES_*
 *  - LIMIT_DAILY_EXPORTS_* 
 *  - FEATURE_* toggles (true/false): FEATURE_AI_MODERATION_* , FEATURE_MULTISTREAM_* , FEATURE_STATS_EXPORT_*
 */
export const LIMITS: Record<TierName, Limits> = {
  FREE: {
    templatesMax: envInt("LIMIT_TEMPLATES_FREE", 2),
    uploadMaxBytes: MB(envInt("LIMIT_UPLOAD_FREE_MB", 25)), // 25 MB
    concurrent: {
      uploads: envInt("LIMIT_CONCURRENT_UPLOADS_FREE", 2),
      recordings: envInt("LIMIT_CONCURRENT_RECORDINGS_FREE", 0),
      transcodes: envInt("LIMIT_CONCURRENT_TRANSCODES_FREE", 0),
    },
    features: {
      aiModeration: (process.env.FEATURE_AI_MODERATION_FREE ?? "false") === "true",
      multistream:  (process.env.FEATURE_MULTISTREAM_FREE ?? "false") === "true",
      statsExport:  (process.env.FEATURE_STATS_EXPORT_FREE ?? "false") === "true",
    },
    quotas: {
      dailyExports: envInt("LIMIT_DAILY_EXPORTS_FREE", 0),
    },
  },
  PRO: {
    templatesMax: envInt("LIMIT_TEMPLATES_PRO", 20),
    uploadMaxBytes: MB(envInt("LIMIT_UPLOAD_PRO_MB", 250)), // 250 MB
    concurrent: {
      uploads: envInt("LIMIT_CONCURRENT_UPLOADS_PRO", 5),
      recordings: envInt("LIMIT_CONCURRENT_RECORDINGS_PRO", 1),
      transcodes: envInt("LIMIT_CONCURRENT_TRANSCODES_PRO", 2),
    },
    features: {
      aiModeration: (process.env.FEATURE_AI_MODERATION_PRO ?? "true") === "true",
      multistream:  (process.env.FEATURE_MULTISTREAM_PRO ?? "true") === "true",
      statsExport:  (process.env.FEATURE_STATS_EXPORT_PRO ?? "true") === "true",
    },
    quotas: {
      dailyExports: envInt("LIMIT_DAILY_EXPORTS_PRO", 50),
    },
  },
  ENTERPRISE: {
    templatesMax: envInt("LIMIT_TEMPLATES_ENT", 100),
    uploadMaxBytes: MB(envInt("LIMIT_UPLOAD_ENT_MB", 1024)), // 1 GB
    concurrent: {
      uploads: envInt("LIMIT_CONCURRENT_UPLOADS_ENT", 20),
      recordings: envInt("LIMIT_CONCURRENT_RECORDINGS_ENT", 5),
      transcodes: envInt("LIMIT_CONCURRENT_TRANSCODES_ENT", 10),
    },
    features: {
      aiModeration: (process.env.FEATURE_AI_MODERATION_ENT ?? "true") === "true",
      multistream:  (process.env.FEATURE_MULTISTREAM_ENT ?? "true") === "true",
      statsExport:  (process.env.FEATURE_STATS_EXPORT_ENT ?? "true") === "true",
    },
    quotas: {
      dailyExports: envInt("LIMIT_DAILY_EXPORTS_ENT", 1000),
    },
  },
};

/**
 * PRO-gleich behandeln?
 * - Day-Pass zhlt als PRO.
 * - SUPERUSER kann (optional) wie ENTERPRISE behandelt werden.
 */
export function isProLike(tier: TierName, active: boolean): boolean {
  return active && tier !== "FREE";
}

/** Effektive Limits fr einen Nutzer (mit SUPERUSER-Lift) */
export function getLimitsForUser(user?: {
  role?: "USER" | "SUPERUSER";
  tier?: TierName;
  active?: boolean;       // vom /status
  validUntil?: Date | string | null; // optional (Day-Pass)
}): Limits {
  if (user?.role === "SUPERUSER") {
    // SUPERUSER = grozgigste Limits
    return LIMITS.ENTERPRISE;
  }

  const tier: TierName = user?.tier ?? "FREE";
  const active = !!user?.active;

  if (!isProLike(tier, active)) {
    return LIMITS.FREE;
  }
  return tier === "ENTERPRISE" ? LIMITS.ENTERPRISE : LIMITS.PRO;
}

/** Nur die Upload-Grenze (Bytes)  z. B. fr Multer/Limits */
export function getUploadByteLimitForUser(user?: {
  role?: "USER" | "SUPERUSER";
  tier?: TierName;
  active?: boolean;
}): number {
  return getLimitsForUser(user).uploadMaxBytes;
}

/** Max. Vorlagenanzahl nach Nutzer */
export function getTemplatesMaxForUser(user?: {
  role?: "USER" | "SUPERUSER";
  tier?: TierName;
  active?: boolean;
}): number {
  return getLimitsForUser(user).templatesMax;
}


