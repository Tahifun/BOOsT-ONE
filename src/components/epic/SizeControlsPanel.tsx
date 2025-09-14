// src/components/epic/SizeControlsPanel.tsx
import React from "react";
import type { Size as HookSize } from "@/hooks/useLivestream"; // <- exakt derselbe Typ wie im Hook

export interface SizeControlsPanelProps {
  /** Kann z.B. "720p" oder {width,height} sein – genau wie im Hook */
  size: HookSize;
  onSizeChange: (s: HookSize) => void;

  isStreaming: boolean;
  onStartStream: () => void;
  onStopStream: () => void;

  onPanic?: () => void;
  onTakeScreenshot?: () => void;
  onStartRecording?: () => void;
}

/** Presets, falls dein Hook 'size' als String liefert */
const PRESETS: Record<string, { width: number; height: number }> = {
  "480p": { width: 854, height: 480 },
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "1440p": { width: 2560, height: 1440 },
  "4k": { width: 3840, height: 2160 },
};

function toUiSize(v: HookSize): { width: number; height: number } {
  if (typeof v === "string") return PRESETS[v.toLowerCase()] ?? { width: 1280, height: 720 };
  // Objektform:
  const { width, height } = v as any;
  if (typeof width === "number" && typeof height === "number") return { width, height };
  return { width: 1280, height: 720 };
}

function fromUiSize(
  ui: { width: number; height: number },
  original: HookSize
): HookSize {
  // Wenn original ein String-Preset war, versuche zurück auf ein Preset zu mappen.
  if (typeof original === "string") {
    const match = Object.entries(PRESETS).find(
      ([, val]) => val.width === ui.width && val.height === ui.height
    );
    return (match?.[0] as HookSize) ?? (ui as unknown as HookSize);
  }
  // Sonst in Objektform zurückgeben:
  return ui as unknown as HookSize;
}

export const SizeControlsPanel: React.FC<SizeControlsPanelProps> = ({
  size,
  onSizeChange,
  isStreaming,
  onStartStream,
  onStopStream,
  onPanic,
  onTakeScreenshot,
  onStartRecording,
}) => {
  const ui = toUiSize(size);

  const change = (partial: Partial<typeof ui>) => {
    const next = { ...ui, ...partial };
    onSizeChange(fromUiSize(next, size));
  };

  const noop = () => {};

  return (
    <div className="epic-card">
      <div className="section-title">Stream / Größe</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label>
          Breite
          <input
            type="number"
            value={ui.width}
            onChange={(e) => change({ width: Number(e.target.value) || 0 })}
            min={1}
          />
        </label>
        <label>
          Höhe
          <input
            type="number"
            value={ui.height}
            onChange={(e) => change({ height: Number(e.target.value) || 0 })}
            min={1}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {!isStreaming ? (
          <button className="btn primary" onClick={onStartStream}>Start</button>
        ) : (
          <button className="btn" onClick={onStopStream}>Stop</button>
        )}

        <button className="btn danger" onClick={onPanic ?? noop}>Panic</button>
        <button className="btn" onClick={onTakeScreenshot ?? noop}>Screenshot</button>
        <button className="btn" onClick={onStartRecording ?? noop}>Record</button>
      </div>
    </div>
  );
};

export default SizeControlsPanel;
