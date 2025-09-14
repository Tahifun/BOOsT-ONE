// src/hooks/useLivestream.ts
import { useState } from "react";

export type Size = "S" | "M" | "L";

export interface EffectSettings {
  mode?: string;
  blurIntensity?: number;
  brightness?: number;
  contrast?: number;
  mirror?: boolean;
  faceDetection?: boolean;
}

export interface LivestreamState {
  showChat: boolean;
  setShowChat: (v: boolean) => void;

  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;

  deviceSettings: Record<string, any>;
  setDeviceSettings: (s: Record<string, any>) => void;

  effectSettings: EffectSettings;
  setEffectSettings: (e: EffectSettings) => void;

  stats: { viewers: number; likes: number; gifts: number };

  size: Size;
  setSize: (s: Size) => void;
}

/** Named export + Default export, damit beide Import-Varianten funktionieren */
export function useLivestream(): LivestreamState {
  const [showChat, setShowChat] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  const [deviceSettings, setDeviceSettings] = useState<Record<string, any>>({});
  const [effectSettings, setEffectSettings] = useState<EffectSettings>({
    mode: "none",
    blurIntensity: 0,
    brightness: 1,
    contrast: 1,
    mirror: false,
    faceDetection: false,
  });

  const [size, setSize] = useState<Size>("M");

  const [stats] = useState({ viewers: 0, likes: 0, gifts: 0 });

  return {
    showChat,
    setShowChat,
    isStreaming,
    setIsStreaming,
    deviceSettings,
    setDeviceSettings,
    effectSettings,
    setEffectSettings,
    stats,
    size,
    setSize,
  };
}

export default useLivestream;
