import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { MediaContext } from '../../contexts/MediaContext';
import type { MediaItem } from '../../types/mediaTypes';
import "../../styles/media.css";

import SoundGrid, { type SoundItem } from './soundboard/SoundGrid';

// Kategorie ableiten
function inferCategory(item: MediaItem): SoundItem["category"] {
  const name = `${item.name ?? ""} ${("tags" in item && Array.isArray((item as any).tags)) ? (item as any).tags.join(" ") : ""}`.toLowerCase();
  const url = `${item.url ?? ""}`.toLowerCase();
  const hit = (s: string) => name.includes(s) || url.includes(s);
  if (hit("meme")) return "meme";
  if (hit("sfx") || hit("effect") || hit("fx") || hit("click") || hit("ding")) return "sfx";
  if (hit("voice") || hit("voc") || hit("speech")) return "voice";
  if (hit("ambient") || hit("rain") || hit("wind") || hit("room")) return "ambient";
  if (hit("notif") || hit("notify") || hit("ping") || hit("alert")) return "notification";
  if (hit("intro")) return "intro";
  if (hit("outro")) return "outro";
  if (hit("transition") || hit("whoosh")) return "transition";
  if (hit("custom")) return "custom";
  return "music";
}

// Farbe je Kategorie
function colorForCategory(cat: SoundItem["category"]): string {
  switch (cat) {
    case "music": return "#00ffcc";
    case "sfx": return "#ffaa00";
    case "voice": return "#8a2be2";
    case "ambient": return "#3b82f6";
    case "notification": return "#ff0050";
    case "meme": return "#ec4899";
    case "transition": return "#10b981";
    case "intro": return "#06b6d4";
    case "outro": return "#a855f7";
    case "custom": return "#ffd700";
    default: return "#00ffcc";
  }
}

export const SoundboardManager: React.FC = () => {
  const { mediaItems } = useContext(MediaContext);

  // Toolbar-State
  const [masterVolume, setMasterVolume] = useState(0.8);     // 0..1
  const [exclusive, setExclusive] = useState(true);          // nur ein Sound gleichzeitig

  // Media  SoundItem
  const mediaSounds = useMemo<MediaItem[]>(
    () => (mediaItems || []).filter((m) => (m as any).type === "sound"),
    [mediaItems]
  );

  const baseSoundItems = useMemo<SoundItem[]>(
    () =>
      mediaSounds.map((m, idx) => {
        const category = inferCategory(m);
        const color = colorForCategory(category);
        const safeUrl = (m as any).url || "";
        return {
          id: String((m as any).id ?? `${idx}`),
          name: (m as any).name ?? `Sound ${idx + 1}`,
          url: safeUrl,
          duration: 0,
          category,
          color,
          volume: 1,
          fadeIn: 0.12,
          fadeOut: 0.2,
          loop: false,
          muted: false,
          playing: false,
          playCount: 0,
          lastPlayed: undefined,
          tags: Array.isArray((m as any).tags) ? (m as any).tags : [],
          metadata: { format: safeUrl.split(".").pop() },
          effects: [],
          gridPosition: { x: idx % 4, y: Math.floor(idx / 4), width: 1, height: 1 },
          locked: (m as any).locked ?? false,
          favorite: (m as any).favorite ?? false,
        } as SoundItem;
      }),
    [mediaSounds]
  );

  // Lokaler Grid-State
  const [gridSounds, setGridSounds] = useState<SoundItem[]>(baseSoundItems);

  // Bei nderungen synchronisieren (playing/vol m�glichst erhalten)
  useEffect(() => {
    setGridSounds((prev) => {
      const prevMap = new Map(prev.map((s) => [s.id, s]));
      return baseSoundItems.map((b) => {
        const old = prevMap.get(b.id);
        return old
          ? { ...b, playing: old.playing, playCount: old.playCount, hotkey: old.hotkey, favorite: old.favorite, muted: old.muted, volume: old.volume }
          : b;
      });
    });
  }, [baseSoundItems]);

  // Callbacks f�r Grid
  const onSoundUpdate = useCallback((sound: SoundItem) => {
    setGridSounds((prev) => prev.map((s) => (s.id === sound.id ? { ...s, ...sound } : s)));
  }, []);

  const onSoundPlay = useCallback((soundId: string) => {
    setGridSounds((prev) =>
      prev.map((s) =>
        s.id === soundId
          ? { ...s, playing: true, playCount: (s.playCount || 0) + 1, lastPlayed: new Date() }
          : (exclusive ? { ...s, playing: false } : s)
      )
    );
  }, [exclusive]);

  const onSoundStop = useCallback((soundId: string) => {
    setGridSounds((prev) => prev.map((s) => (s.id === soundId ? { ...s, playing: false } : s)));
  }, []);

  const onSoundDelete = useCallback((soundId: string) => {
    setGridSounds((prev) => prev.filter((s) => s.id !== soundId));
  }, []);

  const onHotkeyAssign = useCallback((soundId: string, hotkey: string) => {
    setGridSounds((prev) => prev.map((s) => (s.id === soundId ? { ...s, hotkey } : s)));
  }, []);

  return (
    <div className="soundboard-manager">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}> Soundboard</h2>

        {/* Master Volume */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
          <span style={{ opacity: 0.75, minWidth: 90 }}>Master-Volume</span>
          <input
            type="range"
            min={0} max={1} step={0.01}
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
          />
          <span style={{ width: 36, textAlign: "right" }}>{Math.round(masterVolume * 100)}%</span>
        </label>

        {/* Nur ein Sound gleichzeitig */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
          <input
            type="checkbox"
            checked={exclusive}
            onChange={(e) => setExclusive(e.target.checked)}
          />
          <span style={{ opacity: 0.75 }}>Nur eins zurzeit</span>
        </label>
      </div>

      {gridSounds.length === 0 && <div>Keine Sounds vorhanden.</div>}

      <div className="soundboard-list" style={{ minHeight: 200 }}>
        <SoundGrid
          sounds={gridSounds}
          onSoundUpdate={onSoundUpdate}
          onSoundPlay={onSoundPlay}
          onSoundStop={onSoundStop}
          onSoundDelete={onSoundDelete}
          onHotkeyAssign={onHotkeyAssign}
          gridSize={4}
          viewMode="grid"
          enableDragDrop={true}
          showWaveforms={true}
          quantumMode={true}                // Quantum-Effekte aktiv
          masterVolume={masterVolume}       // NEW
          exclusivePlayback={exclusive}     // NEW
        />
      </div>
    </div>
  );
};

export default SoundboardManager;

