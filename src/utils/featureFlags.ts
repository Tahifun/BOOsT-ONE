import { logger } from '@/lib/logger';
import React from "react";
import { API_BASE } from "@/env";

/* eslint-disable @typescript-eslint/no-explicit-any */

// -------------------------------------------------------------
// Feature Flags & Remote Config Manager
// – nutzt jetzt ABSOLUTE API-URL aus env (API_BASE)
// – POST auf `${API_BASE}/feature-flags` mit credentials
// -------------------------------------------------------------

// Types
export type UserSegment = 'free' | 'pro' | 'beta' | 'admin' | 'developer';
export type FeatureFlagValue = boolean | number | string | Record<string, any>;

export interface FeatureFlag {
  key: string;
  value: FeatureFlagValue;
  enabled: boolean;
  description?: string;
  segments: UserSegment[];
  rolloutPercentage?: number; // 0–100
  conditions?: {
    minVersion?: string;
    platform?: ('web' | 'mobile' | 'desktop')[];
    browser?: ('chrome' | 'firefox' | 'safari' | 'edge')[];
    performance?: 'high' | 'medium' | 'low';
  };
  expiresAt?: Date;
  createdAt: Date;
}

export interface UserContext {
  userId: string;
  segment: UserSegment;
  version: string;
  platform: 'web' | 'mobile' | 'desktop';
  browser: string;
  performance: 'high' | 'medium' | 'low';
  sessionId: string;
}

export interface RemoteConfig {
  flags: Record<string, Omit<FeatureFlag, 'key'>>;
  experiments: {
    [experimentName: string]: {
      variant: string;
      enabled: boolean;
      segments: UserSegment[];
      rolloutPercentage?: number;
    }
  };
}

// -------------------------------------------------------------
// Manager
// -------------------------------------------------------------
class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private userContext: UserContext;
  private remoteConfig: RemoteConfig | null = null;
  private lastRemoteUpdate = 0;
  private updateInterval: number | null = null;

  private readStoredSegment(): UserSegment {
    try {
      const v = localStorage.getItem('epicstream_user_segment') as UserSegment | null;
      if (v && ['free','pro','beta','admin','developer'].includes(v)) return v;
    } catch {}
    return 'free';
  }

  // Default flags
  private readonly defaultFlags: Record<string, Omit<FeatureFlag, 'key' | 'createdAt'>> = {
    EPIC_MODE_ENABLED: {
      value: true,
      enabled: true,
      description: 'Enable Epic theme with glassmorphism and advanced effects',
      segments: ['free', 'pro', 'beta', 'admin', 'developer'],
      rolloutPercentage: 100,
      conditions: {}
    },
    PARTICLE_EFFECTS: {
      value: true,
      enabled: true,
      description: 'High-end particle effects for Epic mode',
      segments: ['pro', 'beta', 'admin', 'developer'],
      rolloutPercentage: 80,
      conditions: { performance: 'high' }
    },
    GLASSMORPHISM_EFFECTS: {
      value: true,
      enabled: true,
      description: 'Backdrop-filter glassmorphism effects',
      segments: ['free', 'pro', 'beta', 'admin', 'developer'],
      rolloutPercentage: 90,
      conditions: {}
    },
  };

  constructor() {
    this.userContext = this.detectUserContext();
    this.initializeFlags();
    this.loadLocalFlags();
    this.startRemoteConfigPolling();

    window.addEventListener('performanceAdjustment', this.handlePerformanceChange.bind(this));
  }

  private ensureUserContext(): void {
    if (!this.userContext) {
      try {
        this.userContext = this.detectUserContext();
      } catch {
        this.userContext = {
          userId: 'anonymous',
          segment: 'free',
          version: '0.0.0',
          platform: (typeof navigator !== 'undefined' && /mobi|android/i.test(navigator.userAgent)) ? 'mobile' : 'web',
          browser: (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'),
          performance: 'medium',
          sessionId: 'sess_' + Math.random().toString(36).slice(2)
        };
      }
    }
  }

  // -------- Context detection --------
  private detectUserContext(): UserContext {
    const userAgent = navigator.userAgent.toLowerCase();

    // Browser
    let browser = 'unknown';
    if (userAgent.includes('chrome')) browser = 'chrome';
    else if (userAgent.includes('firefox')) browser = 'firefox';
    else if (userAgent.includes('safari')) browser = 'safari';
    else if (userAgent.includes('edge')) browser = 'edge';

    // Platform
    let platform: UserContext['platform'] = 'web';
    if (userAgent.includes('mobile')) platform = 'mobile';
    else if (userAgent.includes('electron')) platform = 'desktop';

    // Perf guess
    let performance: UserContext['performance'] = 'medium';
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    if (cores >= 8 && memory >= 8) performance = 'high';
    else if (cores <= 2 || memory <= 2) performance = 'low';

    return {
      userId: this.getUserId(),
      segment: this.readStoredSegment(),
      version: this.getAppVersion(),
      platform,
      browser,
      performance,
      sessionId: this.generateSessionId(),
    };
  }

  private getUserId(): string {
    let userId = localStorage.getItem('epicstream_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('epicstream_user_id', userId);
    }
    return userId;
  }

  private getAppVersion(): string {
    return (import.meta as any).env?.VITE_APP_VERSION || '1.0.0';
  }

  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substr(2, 9);
  }

  // -------- Lifecycle --------
  private initializeFlags(): void {
    Object.entries(this.defaultFlags).forEach(([key, flagConfig]) => {
      this.flags.set(key, { key, ...flagConfig, createdAt: new Date() });
    });
  }

  private loadLocalFlags(): void {
    try {
      const stored = localStorage.getItem('epicstream_feature_flags');
      if (stored) {
        const localFlags: Record<string, Partial<FeatureFlag>> = JSON.parse(stored);
        Object.entries(localFlags).forEach(([key, override]) => {
          const existingFlag = this.flags.get(key);
          if (existingFlag) this.flags.set(key, { ...existingFlag, ...override });
        });
      }
    } catch (error) {
      console.warn('Failed to load local feature flags:', error);
    }
  }

  private startRemoteConfigPolling(): void {
    this.updateInterval = window.setInterval(() => {
      this.loadRemoteFlags();
    }, 5 * 60 * 1000);
    this.loadRemoteFlags();
  }

  public async loadRemoteFlags(): Promise<void> {
    this.ensureUserContext();
    try {
      const response = await fetch(`${API_BASE}/feature-flags`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userContext.userId,
          segment: this.userContext.segment,
          version: this.userContext.version,
          platform: this.userContext.platform,
          browser: this.userContext.browser,
          sessionId: this.userContext.sessionId,
        }),
      });

      if (response.ok) {
        const remoteConfig: RemoteConfig = await response.json();
        this.applyRemoteConfig(remoteConfig);
        this.lastRemoteUpdate = Date.now();
      }
    } catch {
      console.debug('Remote feature flags unavailable, using local config');
    }
  }

  private applyRemoteConfig(config: RemoteConfig): void {
    Object.entries(config.flags).forEach(([key, remoteFlag]) => {
      const localFlag = this.flags.get(key);
      if (!localFlag) return;
      this.flags.set(key, {
        ...localFlag,
        ...remoteFlag,
        createdAt: localFlag.createdAt,
      });
    });
    this.remoteConfig = config;
    this.saveLocalFlags();
    logger.debug('📡 Remote feature flags updated:', Object.keys(config.flags).length + ' flags');
  }

  private saveLocalFlags(): void {
    const out: Record<string, Partial<FeatureFlag>> = {};
    this.flags.forEach((f, key) => { out[key] = { ...f }; });
    localStorage.setItem('epicstream_feature_flags', JSON.stringify(out));
  }

  private handlePerformanceChange(event: CustomEvent): void {
    const { metrics } = event.detail;
    if (metrics.fps < 30) this.userContext.performance = 'low';
    else if (metrics.fps > 50) this.userContext.performance = 'high';
    else this.userContext.performance = 'medium';
    this.reevaluateFlags();
  }

  private reevaluateFlags(): void {
    window.dispatchEvent(new Event('featureFlagsReevaluated'));
  }

  // -------- Public API --------
  public isFeatureEnabled(flagName: string): boolean {
    const flag = this.flags.get(flagName);
    if (!flag) {
      console.warn(`Feature flag "${flagName}" not found`);
      return false;
    }
    return this.evaluateFlag(flag);
  }

  public getFeatureValue<T = FeatureFlagValue>(flagName: string): T | null {
    this.ensureUserContext();
    const flag = this.flags.get(flagName);
    if (!flag || !this.evaluateFlag(flag)) return null;
    return (flag.value as T) ?? null;
  }

  private evaluateFlag(flag: FeatureFlag): boolean {
    this.ensureUserContext();

    if (!flag.enabled) return false;
    if (flag.expiresAt && flag.expiresAt < new Date()) return false;

    if (!flag.segments.includes(this.userContext.segment)) return false;

    if (flag.conditions) {
      const { minVersion, platform, browser, performance } = flag.conditions;
      if (minVersion && this.compareVersions(this.userContext.version, minVersion) < 0) return false;
      if (platform && !platform.includes(this.userContext.platform)) return false;
      if (browser && !browser.includes(this.userContext.browser as any)) return false;
      if (performance && this.userContext.performance !== performance) return false;
    }

    if (typeof flag.rolloutPercentage === 'number') {
      const hash = this.hashUserId(this.userContext.userId + flag.key);
      const userPercentile = hash % 100;
      if (userPercentile >= flag.rolloutPercentage) return false;
    }

    return true;
  }

  private compareVersions(version1: string, version2: string): number {
    const v1 = version1.split('.').map(n => parseInt(n || '0', 10));
    const v2 = version2.split('.').map(n => parseInt(n || '0', 10));
    const max = Math.max(v1.length, v2.length);
    for (let i = 0; i < max; i++) {
      const a = v1[i] ?? 0, b = v2[i] ?? 0;
      if (a > b) return 1;
      if (a < b) return -1;
    }
    return 0;
  }

  private hashUserId(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  public getUserSegment(): UserSegment {
    return this.userContext?.segment ?? 'free';
  }

  public setUserSegment(segment: UserSegment): void {
    localStorage.setItem('epicstream_user_segment', segment);
    this.userContext.segment = segment;
    this.reevaluateFlags();
  }

  public overrideFlag(flagName: string, value: FeatureFlagValue): void {
    const flag = this.flags.get(flagName);
    if (!flag) return;
    flag.value = value;
    this.flags.set(flagName, flag);
    this.saveLocalFlags();
    this.reevaluateFlags();
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    window.removeEventListener('performanceAdjustment', this.handlePerformanceChange.bind(this));
  }
}

// Singleton
export const featureFlags = new FeatureFlagManager();

// Convenience helpers
export const isFeatureEnabled = (flagName: string): boolean =>
  featureFlags.isFeatureEnabled(flagName);

export const getFeatureValue = <T = FeatureFlagValue>(flagName: string): T | null =>
  featureFlags.getFeatureValue<T>(flagName);

// Hooks
export function useFeatureFlag(flagName: string): {
  enabled: boolean; value: FeatureFlagValue | null; loading: boolean;
} {
  const [enabled, setEnabled] = React.useState(() => isFeatureEnabled(flagName));
  const [value, setValue] = React.useState(() => getFeatureValue(flagName));
  const [loading] = React.useState(false);

  React.useEffect(() => {
    const handle = () => {
      setEnabled(isFeatureEnabled(flagName));
      setValue(getFeatureValue(flagName));
    };
    window.addEventListener('performanceAdjustment', handle);
    window.addEventListener('featureFlagsReevaluated', handle);
    return () => {
      window.removeEventListener('performanceAdjustment', handle);
      window.removeEventListener('featureFlagsReevaluated', handle);
    };
  }, [flagName]);

  return { enabled, value, loading };
}

export function useFeatureFlags(flagNames: string[]) {
  const [flags, setFlags] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const update = () => {
      const result: Record<string, boolean> = {};
      flagNames.forEach(name => { result[name] = isFeatureEnabled(name); });
      setFlags(result);
    };
    window.addEventListener('performanceAdjustment', update);
    window.addEventListener('featureFlagsReevaluated', update);
    return () => {
      window.removeEventListener('performanceAdjustment', update);
      window.removeEventListener('featureFlagsReevaluated', update);
    };
  }, [flagNames]);

  return flags;
}
