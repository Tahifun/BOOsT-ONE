// src/contexts/OverlayConfigContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

/* ===========================
   Konfigurationstypen
   =========================== */
// ALLE Overlay-Widgets hier als Schlüssel auflisten!
export interface OverlayConfig {
  viewerStats: boolean;
  coinStats: boolean;
  followerStats: boolean;
  tikTokStats: boolean;
  sentimentGraph: boolean;
  proAnalytics: boolean;
  viewerGraph: boolean;
  followerTrend: boolean;
  sessionTimeline: boolean;
  heatmapStats: boolean;
  rewatchStats: boolean;
  chatPeakGraph: boolean;
  spotifyNowPlaying: boolean;
  // >>> Hier kannst du weitere Widget-Keys ergänzen! <<<
}

// **Standard-Konfiguration:** Alle Overlays anfangs aktiviert
const defaultConfig: OverlayConfig = {
  viewerStats: true,
  coinStats: true,
  followerStats: true,
  tikTokStats: true,
  sentimentGraph: true,
  proAnalytics: true,
  viewerGraph: true,
  followerTrend: true,
  sessionTimeline: true,
  heatmapStats: true,
  rewatchStats: true,
  chatPeakGraph: true,
  spotifyNowPlaying: true,
  // Bei neuen Widgets: einfach hier ergänzen!
};

interface OverlayConfigContextType {
  config: OverlayConfig;
  setConfig: Dispatch<SetStateAction<OverlayConfig>>;
}

// Default-Fallback-Kontext, falls Provider vergessen wird
const OverlayConfigContext = createContext<OverlayConfigContextType>({
  config: defaultConfig,
  setConfig: () => {
    /* noop */
  },
});

// Provider: Holt und speichert Overlay-Konfiguration aus/in localStorage
export const OverlayConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<OverlayConfig>(() => {
    const stored = localStorage.getItem("overlayConfig");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Falls ein Key fehlt (z.B. nach App-Update), Standard-Werte auffüllen:
        return { ...defaultConfig, ...parsed };
      } catch {
        return defaultConfig;
      }
    }
    return defaultConfig;
  });

  // Immer bei Änderung: LocalStorage aktualisieren
  useEffect(() => {
    localStorage.setItem("overlayConfig", JSON.stringify(config));
  }, [config]);

  return (
    <OverlayConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </OverlayConfigContext.Provider>
  );
};

// Custom Hook: Für einfachen Zugriff in allen Komponenten
export const useOverlayConfig = () => useContext(OverlayConfigContext);

export default OverlayConfigContext;
