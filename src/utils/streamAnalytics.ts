/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Stream Analytics - robuste, lokal speicherbare Analytics f�r den Livestream.
 * Wichtige Fixes:
 * - String-Datumswerte aus localStorage werden mit `toTime()` sicher behandelt.
 * - cleanupOldData() filtert ausschlie�lich via `toTime(...)`, nie via `.getTime()` auf Strings.
 * - Public API/Export-Namen bleiben erhalten (trackStreamStart/End, trackViewerInteraction, trackThemeSwitch,
 *   trackPerformanceMetric, generateStreamReport, exportAnalyticsData, clearAnalyticsData, useStreamAnalytics, streamAnalytics).
 */

// ------------------------- Hilfsfunktion -------------------------

/** robust: Date | string | number -> epoch ms */
function toTime(v: unknown): number {
  try {
    if (!v) return 0;
    if (typeof v === "number") return v;
    if (v instanceof Date) return v.getTime();
    const t = new Date(v as any).getTime();
    return isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
}

// ------------------------- Typen -------------------------

export type ThemeType = "epic" | "classic";
export type StreamEvent = "start" | "end" | "pause" | "resume" | "error";
export type ViewerAction =
  | "chat"
  | "gift"
  | "follow"
  | "subscribe"
  | "share"
  | "theme_switch"
  | "widget_interact";
export type PerformanceMetric =
  | "fps"
  | "memory"
  | "render_time"
  | "particle_count"
  | "quality_reduction";

export interface StreamEventData {
  id: string;
  type: StreamEvent;
  timestamp: Date | string | number;
  theme: ThemeType;
  metadata?: Record<string, any>;
}

export interface ViewerInteractionData {
  id: string;
  action: ViewerAction;
  userId?: string;
  value?: number | string;
  timestamp: Date | string | number;
  theme: ThemeType;
  metadata?: Record<string, any>;
}

export interface PerformanceData {
  id: string;
  metric: PerformanceMetric;
  value: number;
  unit?: string;
  timestamp: Date | string | number;
  theme: ThemeType;
  metadata?: Record<string, any>;
}

export interface QualityMetrics {
  fpsAvg: number;
  memoryAvgMB: number;
  renderTimeAvgMs: number;
  particleCountAvg?: number;
}

export interface StreamSession {
  sessionId: string;
  streamId: string;
  userId: string;
  theme: ThemeType;
  startTime: Date | string | number;
  endTime?: Date | string | number;
  totalViewers: number;
  peakViewers: number;
  events: StreamEventData[];
  interactions: ViewerInteractionData[];
  performance: PerformanceData[];
  quality: QualityMetrics;
  errors: { message: string; when: Date | string | number }[];
}

export interface ThemeSwitchData {
  id: string;
  from: ThemeType;
  to: ThemeType;
  timestamp: Date | string | number;
}

// ------------------------- Implementierung -------------------------

interface AnalyticsConfig {
  retentionDays: number;
  maxEventsPerDay: number;
}

class StreamAnalytics {
  private config: AnalyticsConfig = {
    retentionDays: 14,
    maxEventsPerDay: 5000,
  };

  private currentSession: StreamSession | null = null;

  private eventQueue: (StreamEventData | ViewerInteractionData | PerformanceData)[] =
    [];

  constructor() {
    // Beim Start alte Daten bereinigen (robust)
    this.cleanupOldData();
  }

  // ------------------- Persistenz-Helfer -------------------

  private readJSON<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private writeJSON<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota voll? Ignorieren.
    }
  }

  // ------------------- �ffentliche API -------------------

  public trackStreamStart(payload: {
    streamId: string;
    userId: string;
    theme: ThemeType;
    startTime?: Date | string | number;
  }): void {
    const now = Date.now();
    const startTs = payload.startTime ?? now;

    this.currentSession = {
      sessionId: "sess_" + Math.random().toString(36).slice(2),
      streamId: payload.streamId,
      userId: payload.userId,
      theme: payload.theme,
      startTime: startTs,
      totalViewers: 0,
      peakViewers: 0,
      events: [],
      interactions: [],
      performance: [],
      quality: { fpsAvg: 0, memoryAvgMB: 0, renderTimeAvgMs: 0 },
      errors: [],
    };

    this.addEvent({
      id: "evt_" + Math.random().toString(36).slice(2),
      type: "start",
      timestamp: now,
      theme: payload.theme,
    });

    // Persist Sessions-Array
    const sessions = this.readJSON<StreamSession[]>("epicstream_sessions", []);
    sessions.push(this.currentSession);
    this.writeJSON("epicstream_sessions", sessions);
  }

  public trackStreamEnd(payload?: {
    endTime?: Date | string | number;
    reason?: string;
  }): void {
    if (!this.currentSession) return;
    const endTime = payload?.endTime ?? Date.now();
    this.currentSession.endTime = endTime;

    this.addEvent({
      id: "evt_" + Math.random().toString(36).slice(2),
      type: "end",
      timestamp: endTime,
      theme: this.currentSession.theme,
      metadata: payload?.reason ? { reason: payload.reason } : undefined,
    });

    // Sessions zur�ckschreiben
    const sessions = this.readJSON<StreamSession[]>("epicstream_sessions", []);
    const idx = sessions.findIndex(
      (s) => s.sessionId === this.currentSession!.sessionId
    );
    if (idx >= 0) {
      sessions[idx] = this.currentSession;
      this.writeJSON("epicstream_sessions", sessions);
    }

    this.currentSession = null;
  }

  public trackViewerInteraction(interaction: Omit<ViewerInteractionData, "id">) {
    const data: ViewerInteractionData = {
      id: "int_" + Math.random().toString(36).slice(2),
      ...interaction,
    };
    if (this.currentSession) {
      this.currentSession.interactions.push(data);
      // ggf. Metriken (peakViewers etc.) hier aktualisieren
    }
    this.eventQueue.push(data);
    this.appendEventToDailyLog("interactions", data);
  }

  public trackThemeSwitch(s: Omit<ThemeSwitchData, "id">) {
    const entry: ThemeSwitchData = {
      id: "sw_" + Math.random().toString(36).slice(2),
      ...s,
    };
    const switches = this.readJSON<ThemeSwitchData[]>(
      "epicstream_theme_switches",
      []
    );
    switches.push(entry);
    this.writeJSON("epicstream_theme_switches", switches);

    // Auch als allgemeines Ereignis f�hren
    this.addEvent({
      id: "evt_" + Math.random().toString(36).slice(2),
      type: "resume",
      theme: s.to,
      timestamp: Date.now(),
      metadata: { from: s.from, to: s.to, kind: "theme_switch" },
    });
  }

  public trackPerformanceMetric(p: Omit<PerformanceData, "id">) {
    const data: PerformanceData = {
      id: "perf_" + Math.random().toString(36).slice(2),
      ...p,
    };
    if (this.currentSession) {
      this.currentSession.performance.push(data);
      // Qualit�t grob nachf�hren (Durchschnittswerte)
      this.recomputeQuality();
    }
    this.eventQueue.push(data);
    this.appendEventToDailyLog("performance", data);
  }

  public generateStreamReport() {
    const sessions = this.readJSON<StreamSession[]>("epicstream_sessions", []);
    const totalSessions = sessions.length;
    const totalEvents = sessions.reduce(
      (acc, s) => acc + (s.events?.length || 0),
      0
    );
    const totalInteractions = sessions.reduce(
      (acc, s) => acc + (s.interactions?.length || 0),
      0
    );

    const lastSession = sessions[sessions.length - 1];
    const durationMs =
      lastSession && lastSession.endTime
        ? toTime(lastSession.endTime) - toTime(lastSession.startTime)
        : 0;

    return {
      totalSessions,
      totalEvents,
      totalInteractions,
      lastSessionDurationMs: Math.max(0, durationMs),
    };
  }

  public exportAnalyticsData(): Blob {
    const sessions = this.readJSON("epicstream_sessions", []);
    const switches = this.readJSON("epicstream_theme_switches", []);
    const out = { sessions, switches };
    return new Blob([JSON.stringify(out, null, 2)], {
      type: "application/json",
    });
  }

  public clearAnalyticsData(): void {
    try {
      localStorage.removeItem("epicstream_sessions");
      localStorage.removeItem("epicstream_theme_switches");
      Object.keys(localStorage)
        .filter((k) => k.startsWith("epicstream_events_"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }

  // ------------------- Interne Helfer -------------------

  private addEvent(evt: StreamEventData): void {
    if (this.currentSession) {
      this.currentSession.events.push(evt);
    }
    this.eventQueue.push(evt);
    this.appendEventToDailyLog("events", evt);
  }

  private appendEventToDailyLog(bucket: "events" | "interactions" | "performance", payload: unknown) {
    const key = "epicstream_events_" + new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const day = this.readJSON<{ events: unknown[]; interactions: unknown[]; performance: unknown[] }>(key, {
      events: [],
      interactions: [],
      performance: [],
    });

    const arr = day[bucket] as unknown[];
    arr.push(payload);

    // cappen
    if (arr.length > this.config.maxEventsPerDay) {
      arr.shift();
    }

    this.writeJSON(key, day);
  }

  private recomputeQuality(): void {
    if (!this.currentSession) return;
    const perf = this.currentSession.performance;
    if (!perf.length) return;

    const fps = perf.filter((p) => p.metric === "fps").map((p) => p.value);
    const mem = perf.filter((p) => p.metric === "memory").map((p) => p.value);
    const rt = perf
      .filter((p) => p.metric === "render_time")
      .map((p) => p.value);

    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    this.currentSession.quality = {
      fpsAvg: Math.round(avg(fps)),
      memoryAvgMB: Math.round(avg(mem)),
      renderTimeAvgMs: Math.round(avg(rt)),
    };
  }

  /**
   * Clean up old data based on retention policy (robust against string dates)
   */
  private cleanupOldData(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    const cutoffTime = cutoffDate.getTime();

    try {
      // Sessions
      const sessionsStored =
        localStorage.getItem("epicstream_sessions") || "[]";
      const sessions: unknown[] = JSON.parse(sessionsStored);
      const recentSessions = sessions.filter(
        (s) => toTime(s?.startTime) > cutoffTime
      );
      this.writeJSON("epicstream_sessions", recentSessions);

      // Theme switches
      const switchesStored =
        localStorage.getItem("epicstream_theme_switches") || "[]";
      const switches: unknown[] = JSON.parse(switchesStored);
      const recentSwitches = switches.filter(
        (s) => toTime(s?.timestamp) > cutoffTime
      );
      this.writeJSON("epicstream_theme_switches", recentSwitches);

      // Daily event logs (Keys nach Datum)
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith("epicstream_events_")
      );
      keys.forEach((key) => {
        const dateStr = key.replace("epicstream_events_", "");
        const eventDate = new Date(dateStr);
        if (eventDate.getTime() < cutoffTime) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Failed to cleanup old analytics data:", error);
    }
  }
}

// ------------------------- Singleton & Hooks -------------------------

export const streamAnalytics = new StreamAnalytics();

/**
 * React Hook - liefert kompakte Summary & gebundene Methoden.
 * (Beispiel-API; du kannst sie nach Bedarf erweitern.)
 */
import { useEffect, useMemo, useState } from "react";

export function useStreamAnalytics() {
  const [summary, setSummary] = useState(() =>
    streamAnalytics.generateStreamReport()
  );
  const [currentSession, setCurrentSession] = useState<StreamSession | null>(
    null
  );

  useEffect(() => {
    // Poll kleine Summary (dev-freundlich)
    const id = window.setInterval(() => {
      setSummary(streamAnalytics.generateStreamReport());
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    // Session-Ref poll (optional)
    const id = window.setInterval(() => {
      // Hier k�nnten wir die aktuelle Session aus storage neu lesen, falls n�tig
      setCurrentSession((prev) => prev ?? null);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  return {
    summary,
    currentSession,
    trackStreamStart: streamAnalytics.trackStreamStart.bind(streamAnalytics),
    trackStreamEnd: streamAnalytics.trackStreamEnd.bind(streamAnalytics),
    trackViewerInteraction:
      streamAnalytics.trackViewerInteraction.bind(streamAnalytics),
    trackThemeSwitch: streamAnalytics.trackThemeSwitch.bind(streamAnalytics),
    trackPerformanceMetric:
      streamAnalytics.trackPerformanceMetric.bind(streamAnalytics),
    generateStreamReport:
      streamAnalytics.generateStreamReport.bind(streamAnalytics),
    exportData: streamAnalytics.exportAnalyticsData.bind(streamAnalytics),
    clearData: streamAnalytics.clearAnalyticsData.bind(streamAnalytics),
  };
}
