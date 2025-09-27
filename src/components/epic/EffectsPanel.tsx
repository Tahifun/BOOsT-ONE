import React from "react";

interface EffectSettings {
  mode?: string;
  blurIntensity?: number;
  brightness?: number;
  contrast?: number;
  mirror?: boolean;
  faceDetection?: boolean;
}

interface Props {
  settings: EffectSettings;
  onSettingsChange: (settings: EffectSettings) => void;
}

export function EffectsPanel({ settings, onSettingsChange }: Props) {
  const handleChange = (key: keyof EffectSettings, value: unknown) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="epic-panel effects-panel">
      <h3 className="panel-title">? Effekte</h3>
      
      <div className="form-group">
        <label className="form-label">Modus</label>
        <select 
          className="form-select"
          value={settings.mode}
          onChange={(e) => handleChange("mode", e.target.value as any)}
        >
          <option value="normal">? Normal</option>
          <option value="face">?? Nur Gesicht</option>
          <option value="blur-bg">?? Blur Hintergrund</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Blur Intensit�t</label>
        <input 
          type="range" 
          className="form-range" 
          min="0" 
          max="30" 
          value={settings.blurIntensity}
          onChange={(e) => handleChange("blurIntensity", parseInt(e.target.value))}
        />
        <span className="range-value">{settings.blurIntensity}</span>
      </div>

      <div className="form-group">
        <label className="form-label">Helligkeit</label>
        <input 
          type="range" 
          className="form-range" 
          min="50" 
          max="150" 
          value={settings.brightness}
          onChange={(e) => handleChange("brightness", parseInt(e.target.value))}
        />
        <span className="range-value">{settings.brightness}%</span>
      </div>

      <div className="form-group">
        <label className="form-label">Kontrast</label>
        <input 
          type="range" 
          className="form-range" 
          min="50" 
          max="150" 
          value={settings.contrast}
          onChange={(e) => handleChange("contrast", parseInt(e.target.value))}
        />
        <span className="range-value">{settings.contrast}%</span>
      </div>

      <div className="checkbox-group">
        <input 
          type="checkbox" 
          className="epic-checkbox" 
          id="mirror"
          checked={settings.mirror}
          onChange={(e) => handleChange("mirror", e.target.checked)}
        />
        <label htmlFor="mirror">Spiegeln</label>
      </div>

      <div className="checkbox-group">
        <input 
          type="checkbox" 
          className="epic-checkbox" 
          id="face-detection"
          checked={settings.faceDetection}
          onChange={(e) => handleChange("faceDetection", e.target.checked)}
        />
        <label htmlFor="face-detection">Face-Detection aktiv</label>
      </div>
    </div>
  );
}


