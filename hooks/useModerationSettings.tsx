import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PRESETS } from '../features/moderation/presets';

type Mode = keyof typeof PRESETS;
type Ctx = {
  settings: ModerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<ModerationSettings>>;
  activePreset: Mode;
  applyPreset: (m: Mode) => Promise<void> | void;
  patch: <K extends keyof ModerationSettings>(
    key: K,
    value: ModerationSettings[K]
  ) => void;
};

const ModerationCtx = createContext<Ctx | null>(null);

const API = import.meta.env.VITE_API_URL || "http://localhost:4001";
const LS_KEY = "moderation.settings.v1";
const LS_MODE = "moderation.mode.v1";

export function ModerationProvider({ children }: { children: React.ReactNode }) {
  const [activePreset, setActivePreset] = useState<Mode>(() => {
    return (localStorage.getItem(LS_MODE) as Mode) || "balanced";
  });

  const [settings, setSettings] = useState<ModerationSettings>(() => {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? (JSON.parse(saved) as ModerationSettings) : PRESETS.balanced;
  });

  // persist local
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem(LS_MODE, activePreset);
  }, [activePreset]);

  const applyPreset = async (mode: Mode) => {
    const next = PRESETS[mode];
    setActivePreset(mode);
    setSettings(next);

    // optional: Backend informieren  falls dein Bot/Twitch-Adapter l�uft
    try {
      await fetch(`${API}/api/mod/settings/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode, settings: next }),
      });
      // Beispiele:
      // await fetch(`${API}/api/twitch/chat/slowmode`, { method:"POST", credentials:"include", body: JSON.stringify({ seconds: next.slowModeSec })});
      // await fetch(`${API}/api/twitch/chat/followers`, { method:"POST", credentials:"include", body: JSON.stringify({ enabled: next.followerOnly })});
    } catch {
      /* offline ok */
    }
  };

  const patch = <K extends keyof ModerationSettings>(key: K, value: ModerationSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const value = useMemo<Ctx>(
    () => ({ settings, setSettings, activePreset, applyPreset, patch }),
    [settings, activePreset]
  );

  return <ModerationCtx.Provider value={value}>{children}</ModerationCtx.Provider>;
}

export const useModerationSettings = () => {
  const ctx = useContext(ModerationCtx);
  if (!ctx) throw new Error("useModerationSettings must be used within ModerationProvider");
  return ctx;
};

