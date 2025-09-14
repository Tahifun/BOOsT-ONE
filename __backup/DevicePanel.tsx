import React from "react";

interface DeviceSettings {
  camId?: string;
  resolution?: string;
  micId?: string;
  showChat?: boolean;
}

interface Props {
  settings: DeviceSettings;
  onSettingsChange: (settings: DeviceSettings) => void;
}

export function DevicePanel({ settings, onSettingsChange }: Props) {
  const handleChange = (key: keyof DeviceSettings, value: unknown) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="epic-panel device-panel">
      <h3 className="panel-title">📹 Geräte</h3>
      
      <div className="form-group">
        <label className="form-label">Kamera</label>
        <select 
          className="form-select"
          value={settings.camId}
          onChange={(e) => handleChange("camId", e.target.value)}
        >
          <option value="">Kamera auswählen...</option>
          <option value="hd-webcam">HD Webcam (1080p)</option>
          <option value="usb-camera">USB Camera</option>
          <option value="obs-virtual">OBS Virtual Camera</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Auflösung</label>
        <select 
          className="form-select"
          value={settings.resolution}
          onChange={(e) => handleChange("resolution", e.target.value)}
        >
          <option>HD (1280x720)</option>
          <option>Full HD (1920x1080)</option>
          <option>4K (3840x2160)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Mikrofon</label>
        <select 
          className="form-select"
          value={settings.micId}
          onChange={(e) => handleChange("micId", e.target.value)}
        >
          <option value="">Mikrofon auswählen...</option>
          <option value="blue-yeti">🎤 Blue Yeti</option>
          <option value="audio-technica">🎤 Audio-Technica AT2020</option>
          <option value="standard">🎤 Standard Mikro</option>
        </select>
      </div>

      <div className="checkbox-group">
        <input 
          type="checkbox" 
          className="epic-checkbox" 
          id="chat-toggle"
          checked={settings.showChat}
          onChange={(e) => handleChange("showChat", e.target.checked)}
        />
        <label htmlFor="chat-toggle">Chat anzeigen</label>
      </div>
    </div>
  );
}


