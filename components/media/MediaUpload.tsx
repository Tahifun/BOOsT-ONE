import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { uploadMediaFile, mapUploadError } from '../../services/mediaService';
import { MediaType } from '../../types/mediaTypes';
import ProFeatureWrapper from '../common/ProFeatureWrapper';

import "../../styles/media.css"; // .media-upload-card, .media-dropzone, .status-error, ...

interface Props {
  onUpload: () => void; // Callback nach erfolgreichem Upload
}

const TYPE_ACCEPT: Record<MediaType, string> = {
  clip: "video/*",
  screenshot: "image/*",
  sound: "audio/*",
  overlay: "image/*,video/*,audio/*",
};

const MAX_MB: Record<MediaType, number> = {
  screenshot: 25,
  sound: 40,
  clip: 250,
  overlay: 200,
};

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0,
    n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2)} ${units[i]}`;
}

function sanitizeName(s: string) {
  return s
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\-_. ]/gu, "")
    .slice(0, 120);
}

const MediaUpload: React.FC<Props> = ({ onUpload }) => {
  const [selectedType, setSelectedType] = useState<MediaType>("clip");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const accept = useMemo(() => TYPE_ACCEPT[selectedType], [selectedType]);
  const maxBytes = useMemo(() => MAX_MB[selectedType] * 1024 * 1024, [selectedType]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const resetFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  function validateFile(f: File, type: MediaType): string | null {
    if (!f) return "Bitte eine Datei auswählen.";
    if (f.size > maxBytes) {
      return `Datei zu gro für ${type}. Maximal ${MAX_MB[type]} MB (deine: ${formatBytes(f.size)}).`;
    }
    // Optional: MIME grob checken (Frontend-Selektion begrenzt bereits)
    return null;
  }

  const handleFileSelect = (f: File | null) => {
    setError(null);
    if (!f) {
      resetFile();
      return;
    }
    const err = validateFile(f, selectedType);
    if (err) {
      setError(err);
      resetFile();
      return;
    }
    setFile(f);
    setName((prev) => (prev ? prev : sanitizeName(f.name)));
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (loading) return;
    const f = e.dataTransfer.files?.[0];
    handleFileSelect(f || null);
  };

  const onBrowse = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    handleFileSelect(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setError(null);
    setLoading(true);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      await uploadMediaFile(
        file,
        { type: selectedType, name: name || sanitizeName(file.name), description },
        ac.signal
      );
      resetFile();
      setName("");
      setDescription("");
      onUpload?.();
    } catch (err: unknown) {
      setError(mapUploadError(err)); // ️ zentrale Fehlermeldung
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProFeatureWrapper featureName="overlay_upload">
      <div className="media-upload-card">
        <h3 className="font-semibold mb-2"> Media Upload</h3>

        {/* Typ-Auswahl */}
        <div className="grid" style={{ gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <label>
            <span className="block text-sm opacity-80 mb-1">Medien-Typ</span>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as MediaType);
                if (file) handleFileSelect(file);
              }}
            >
              <option value="clip">Clip (Video)</option>
              <option value="screenshot">Screenshot (Bild)</option>
              <option value="sound">Sound (Audio)</option>
              <option value="overlay">Overlay (Bild/Video/Audio)</option>
            </select>
          </label>

          <div className="text-sm opacity-80" style={{ alignSelf: "end" }}>
            <div>
              Akzeptiert: <code>{accept}</code>
            </div>
            <div>
              Max: <strong>{MAX_MB[selectedType]} MB</strong>
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <div
          className="media-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={onBrowse}
          role="button"
          aria-label="Datei wählen oder hier ablegen"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? onBrowse() : null)}
          style={{ marginTop: 12 }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Vorschau" style={{ maxHeight: 160, borderRadius: 8 }} />
          ) : (
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Datei hier ablegen oder klicken zum Auswählen
            </div>
          )}
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {file ? (
              <>
                 <strong>{file.name}</strong> · {formatBytes(file.size)}
              </>
            ) : (
              <>Akzeptiert: {accept}</>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Felder */}
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Name des Mediums"
          />
          <textarea
            placeholder="Beschreibung (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="Beschreibung"
            rows={3}
          />
        </div>

        {/* Aktionen */}
        <div className="flex gap-2" style={{ marginTop: 12 }}>
          <button onClick={handleUpload} disabled={loading || !file} type="button">
            {loading ? "Hochladen" : "Upload starten"}
          </button>
          <button onClick={resetFile} disabled={loading || !file} type="button">
            Zurücksetzen
          </button>
        </div>

        {/* Status */}
        {error && (
          <div className="status-error" style={{ marginTop: 8, whiteSpace: "pre-line" }}>
            {error}
          </div>
        )}
      </div>
    </ProFeatureWrapper>
  );
};

export default MediaUpload;
export { MediaUpload };



