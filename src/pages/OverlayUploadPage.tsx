// src/pages/OverlayUploadPage.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { uploadMediaFile, mapUploadError } from "../services/mediaService";
import { MediaType } from "../types/mediaTypes";
import ProFeatureWrapper from "../components/common/ProFeatureWrapper";
import "@/styles/overlay/OverlayUploadPage.css";

interface QuantumParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

interface UploadState {
  phase: "idle" | "analyzing" | "quantum-processing" | "materializing" | "complete" | "error";
  progress: number;
  particles: QuantumParticle[];
}

const QUANTUM_COLORS = ["#00ffff", "#a855f7", "#ec4899", "#10b981", "#ffd700"];
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB (derzeit nicht genutzt, TYPE_CONFIG regelt Gr��e pro Typ)

const TYPE_CONFIG: Record<
  MediaType,
  {
    icon: string;
    accept: string;
    maxMB: number;
    color: string;
    description: string;
  }
> = {
  clip: {
    icon: "??",
    accept: "video/*",
    maxMB: 250,
    color: "#00ffff",
    description: "Video-Clips f�r dynamische Overlays",
  },
  screenshot: {
    icon: "??",
    accept: "image/*",
    maxMB: 25,
    color: "#a855f7",
    description: "Statische Bilder und Screenshots",
  },
  sound: {
    icon: "??",
    accept: "audio/*",
    maxMB: 40,
    color: "#ec4899",
    description: "Audio-Dateien f�r Sound-Overlays",
  },
  overlay: {
    icon: "?",
    accept: "image/*,video/*,audio/*",
    maxMB: 200,
    color: "#ffd700",
    description: "Universelle Overlay-Dateien",
  },
};

const OverlayUploadPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<MediaType>("overlay");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>({
    phase: "idle",
    progress: 0,
    particles: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [consciousness, setConsciousness] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Quantum Particle System
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particles: QuantumParticle[] = [];

    const createParticle = (x?: number, y?: number) => {
      particles.push({
        id: Date.now() + Math.random(),
        x: x ?? Math.random() * canvas.width,
        y: y ?? Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        color: QUANTUM_COLORS[Math.floor(Math.random() * QUANTUM_COLORS.length)],
        life: 1,
      });
    };

    // Initial particles
    for (let i = 0; i < 50; i++) {
      createParticle();
    }

    const animate = () => {
      ctx.fillStyle = "rgba(10, 10, 15, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.005;

        // Quantum tunneling effect at boundaries
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle with quantum glow
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.shadowBlur = 20;
        ctx.shadowColor = particle.color;

        // Particle core
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Quantum field lines
        if (uploadState.phase !== "idle") {
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          const nearbyParticles = particles.filter((p) => {
            const dist = Math.hypot(p.x - particle.x, p.y - particle.y);
            return dist < 100 && dist > 0;
          });
          nearbyParticles.forEach((p) => {
            ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
        }

        ctx.restore();

        // Remove dead particles
        if (particle.life <= 0) {
          particles.splice(index, 1);
        }
      });

      // Add new particles during upload
      if (uploadState.phase !== "idle" && particles.length < 100) {
        createParticle();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [uploadState.phase]);

  // Consciousness meter animation
  useEffect(() => {
    const interval = setInterval(() => {
      setConsciousness((prev) => {
        const target =
          uploadState.phase === "idle"
            ? 30
            : uploadState.phase === "complete"
            ? 100
            : 50 + uploadState.progress * 0.5;
        return prev + (target - prev) * 0.1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [uploadState.phase, uploadState.progress]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files; // FileList
      if (files && files.length > 0) {
        handleFileSelect(files[0]); // File
      }
    },
    [selectedType]
  );

  const handleFileSelect = (selectedFile: File) => {
    setError(null);

    // Validate file size (guard also against total max)
    const maxSize = TYPE_CONFIG[selectedType].maxMB * 1024 * 1024;
    if (selectedFile.size > maxSize || selectedFile.size > MAX_FILE_SIZE) {
      setError(`Datei zu gro�! Maximum: ${Math.min(TYPE_CONFIG[selectedType].maxMB, MAX_FILE_SIZE / (1024 * 1024))}MB`);
      return;
    }

    setFile(selectedFile);
    setName(selectedFile.name.replace(/\.[^/.]+$/, ""));

    // Create preview for images/videos
    if (selectedFile.type.startsWith("image/") || selectedFile.type.startsWith("video/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    // Trigger analyze animation
    setUploadState((prev) => ({ ...prev, phase: "analyzing" }));
    setTimeout(() => {
      setUploadState((prev) => ({ ...prev, phase: "idle" }));
    }, 2000);
  };

  const simulateQuantumUpload = async () => {
    if (!file || !name) {
      setError("Bitte Datei und Name angeben");
      return;
    }

    setError(null);
    setUploadState({ phase: "analyzing", progress: 0, particles: [] });

    // Phase 1: Analyzing (0-30%)
    await animateProgress(0, 30, 1000);
    setUploadState((prev) => ({ ...prev, phase: "quantum-processing" }));

    // Phase 2: Quantum Processing (30-70%)
    await animateProgress(30, 70, 2000);
    setUploadState((prev) => ({ ...prev, phase: "materializing" }));

    // Phase 3: Materializing (70-100%)
    await animateProgress(70, 100, 1500);

    // Actual upload
    try {
      abortControllerRef.current = new AbortController();
      await uploadMediaFile(
        file,
        {
          type: selectedType,
          name: name,
          description,
        },
        abortControllerRef.current.signal
      );

      setUploadState((prev) => ({ ...prev, phase: "complete" }));

      // Success animation
      setTimeout(() => {
        navigate("/overlay/gallery");
      }, 2000);
    } catch (err: unknown) {
      setUploadState((prev) => ({ ...prev, phase: "error" }));
      setError(mapUploadError(err));
    }
  };

  const animateProgress = (start: number, end: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + (end - start) * easeInOutCubic(progress);

        setUploadState((prev) => ({ ...prev, progress: current }));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  };

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setName("");
    setDescription("");
    setError(null);
    setUploadState({ phase: "idle", progress: 0, particles: [] });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <ProFeatureWrapper featureName="overlay_upload">
      <div className="quantum-upload-page">
        <canvas ref={canvasRef} className="quantum-canvas-bg" />

        {/* Quantum Effects Container */}
        <div className="quantum-effects-container">
          <div className="quantum-grid-overlay"></div>
          <div className="consciousness-field" style={{ opacity: consciousness / 100 }}></div>
        </div>

        {/* Header with Back Button */}
        <div className="quantum-upload-header">
          <button className="quantum-back-btn" onClick={() => navigate("/overlay")}>
            <span className="back-icon">?</span>
            <span className="back-text">Zur�ck zur �bersicht</span>
            <div className="btn-quantum-trail"></div>
          </button>

          <div className="consciousness-meter">
            <span className="meter-label">Bewusstsein</span>
            <div className="meter-bar">
              <div className="meter-fill" style={{ width: `${consciousness}%` }} />
            </div>
            <span className="meter-value">{Math.round(consciousness)}%</span>
          </div>
        </div>

        {/* Main Upload Container */}
        <div className="quantum-upload-container">
          <h1 className="quantum-upload-title">
            <span className="title-prefix">Quantum</span>
            <span className="title-main">Overlay Upload</span>
            <span className="title-suffix">Portal</span>
          </h1>

          <p className="quantum-upload-subtitle">Transformiere deine Medien durch quantenverschr�nkte �bertragung</p>

          {/* Media Type Selector */}
          <div className="quantum-type-selector">
            {Object.entries(TYPE_CONFIG).map(([type, config]) => (
              <div
                key={type}
                className={`type-btn ${selectedType === type ? "active" : ""}`}
                onClick={() => setSelectedType(type as MediaType)}
                style={{ "--type-color": config.color } as React.CSSProperties}
              >
                <span className="type-icon">{config.icon}</span>
                <span className="type-name">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                <span className="type-desc">{config.description}</span>
                <div className="type-glow"></div>
              </div>
            ))}
          </div>

          {/* Quantum Drop Zone */}
          <div
            ref={dropZoneRef}
            className={`quantum-dropzone ${isDragging ? "dragging" : ""} ${file ? "has-file" : ""} phase-${uploadState.phase}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="dropzone-portal">
              <div className="portal-rings">
                <div className="ring ring-1"></div>
                <div className="ring ring-2"></div>
                <div className="ring ring-3"></div>
              </div>

              {previewUrl && file?.type.startsWith("image/") ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                  <div className="preview-overlay">
                    <div className="preview-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                </div>
              ) : previewUrl && file?.type.startsWith("video/") ? (
                <div className="preview-container">
                  <video src={previewUrl} className="preview-video" controls />
                </div>
              ) : (
                <div className="dropzone-content">
                  <div className="drop-icon">
                    {uploadState.phase === "analyzing"
                      ? "??"
                      : uploadState.phase === "quantum-processing"
                      ? "??"
                      : uploadState.phase === "materializing"
                      ? "?"
                      : uploadState.phase === "complete"
                      ? "?"
                      : uploadState.phase === "error"
                      ? "?"
                      : "??"}
                  </div>
                  <div className="drop-text">
                    {uploadState.phase === "idle"
                      ? "Ziehe Dateien hierher oder klicke zum Ausw�hlen"
                      : uploadState.phase === "analyzing"
                      ? "Analysiere Quantenstruktur..."
                      : uploadState.phase === "quantum-processing"
                      ? "Verschr�nke Dateipartikel..."
                      : uploadState.phase === "materializing"
                      ? "Materialisiere in der Cloud..."
                      : uploadState.phase === "complete"
                      ? "Upload erfolgreich!"
                      : uploadState.phase === "error"
                      ? "Quantenfehler aufgetreten"
                      : ""}
                  </div>
                  <div className="drop-formats">
                    Unterst�tzt: {TYPE_CONFIG[selectedType].accept} | Max: {TYPE_CONFIG[selectedType].maxMB}MB
                  </div>
                </div>
              )}

              {/* Quantum Progress Indicator */}
              {uploadState.phase !== "idle" && uploadState.phase !== "complete" && (
                <div className="quantum-progress">
                  <div className="progress-ring">
                    <svg viewBox="0 0 100 100">
                      <circle className="progress-track" cx="50" cy="50" r="45" fill="none" strokeWidth="3" />
                      <circle
                        className="progress-fill"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        strokeWidth="3"
                        strokeDasharray={`${uploadState.progress * 2.83} 283`}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="progress-text">{Math.round(uploadState.progress)}%</div>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={TYPE_CONFIG[selectedType].accept}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              style={{ display: "none" }}
            />
          </div>

          {/* Metadata Fields */}
          <div className="quantum-metadata">
            <div className="metadata-field">
              <label className="field-label">
                <span className="label-icon">??</span>
                <span className="label-text">Overlay Name</span>
                <span className="label-required">*</span>
              </label>
              <input
                type="text"
                className="quantum-input"
                placeholder="Gib deinem Overlay einen einzigartigen Namen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
              />
              <div className="input-glow"></div>
            </div>

            <div className="metadata-field">
              <label className="field-label">
                <span className="label-icon">??</span>
                <span className="label-text">Beschreibung</span>
                <span className="label-optional">(optional)</span>
              </label>
              <textarea
                className="quantum-textarea"
                placeholder="Beschreibe dein Overlay f�r andere Nutzer..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <div className="input-glow"></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="quantum-actions">
            <button
              className="action-btn upload-btn"
              onClick={simulateQuantumUpload}
              disabled={!file || !name || uploadState.phase !== "idle"}
            >
              <span className="btn-icon">??</span>
              <span className="btn-text">Quantum Upload starten</span>
              <div className="btn-energy"></div>
            </button>

            <button
              className="action-btn reset-btn"
              onClick={resetForm}
              disabled={
                uploadState.phase !== "idle" &&
                uploadState.phase !== "complete" &&
                uploadState.phase !== "error"
              }
            >
              <span className="btn-icon">??</span>
              <span className="btn-text">Zur�cksetzen</span>
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="quantum-message error-message">
              <span className="message-icon">??</span>
              <span className="message-text">{error}</span>
            </div>
          )}

          {uploadState.phase === "complete" && (
            <div className="quantum-message success-message">
              <span className="message-icon">?</span>
              <span className="message-text">Upload erfolgreich! Weiterleitung zur Galerie...</span>
            </div>
          )}

          {/* Stats Display */}
          <div className="quantum-stats">
            <div className="stat-item">
              <span className="stat-label">Dateigr��e</span>
              <span className="stat-value">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "-"}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Dateityp</span>
              <span className="stat-value">{file?.type || "-"}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Quantum-Status</span>
              <span className="stat-value status-active">Bereit</span>
            </div>
          </div>
        </div>

        {/* Floating Particles Effect */}
        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="particle"
              style={
                {
                  "--delay": `${Math.random() * 5}s`,
                  "--duration": `${10 + Math.random() * 20}s`,
                  "--x": `${Math.random() * 100}%`,
                  "--y": `${Math.random() * 100}%`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>
    </ProFeatureWrapper>
  );
};

export default OverlayUploadPage;
