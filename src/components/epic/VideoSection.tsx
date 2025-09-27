// src/components/epic/VideoSection.tsx
import React, { useEffect, useRef, useState } from "react";

/** Gr��en: Objekt oder Preset-String wie "720p", "1080p" */
type SizeObject = { width: number; height: number };
type SizeProp = SizeObject | string;
type EffectSettings = {
  blur?: number;                // Intensit�t (px)
  saturation?: number;
  contrast?: number;
  backgroundMode?: "none" | "blur" | "face-only";
  [key: string]: unknown;
};

type Props = {
  isStreaming: boolean;
  size?: SizeProp;                    // "720p" | "1080p" | {w,h}
  effectSettings?: EffectSettings;
  cameraDeviceId?: string;            // deviceId aus DevicePanel
  mirror?: boolean;
};

function normalizeSize(s?: SizeProp): SizeObject {
  if (!s) return { width: 1280, height: 720 };
  if (typeof s === "string") {
    switch (s.toLowerCase()) {
      case "480p": return { width: 852, height: 480 };
      case "720p": return { width: 1280, height: 720 };
      case "900p": return { width: 1600, height: 900 };
      case "1080p": return { width: 1920, height: 1080 };
      case "1440p": return { width: 2560, height: 1440 };
      case "2160p":
      case "4k":  return { width: 3840, height: 2160 };
      default:    return { width: 1280, height: 720 };
    }
  }
  return s as SizeObject;
}

function VideoSection({
  isStreaming,
  size,
  effectSettings = {},
  cameraDeviceId,
  mirror = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [segmentationReady, setSegmentationReady] = useState<boolean>(false);

  const currentStream = useRef<MediaStream | null>(null);
  const segmentationRef = useRef<any>(null); // Mediapipe instance
  const rafRef = useRef<number | null>(null);
  const processingRef = useRef<boolean>(false);

  const resolved = normalizeSize(size);
  const bgMode = (effectSettings.backgroundMode ?? "none") as
    | "none"
    | "blur"
    | "face-only";

  // Filter (f�r "none" auf <video>, f�r Canvas im Draw verwendet)
  const blur = effectSettings.blur ?? 10;
  const saturation = effectSettings.saturation ?? 1;
  const contrast = effectSettings.contrast ?? 1;
  const cssFilter = `saturate(${saturation}) contrast(${contrast})`;

  const updateDims = () => {
    const v = videoRef.current;
    if (!v) return;
    const w = v.videoWidth || 0;
    const h = v.videoHeight || 0;
    if (w && h) setDims({ w, h });
  };

  // Kamera Start/Stop + Aufl�sung
  useEffect(() => {
    let cancelled = false;

    const stopTracks = () => {
      currentStream.current?.getTracks().forEach((t) => t.stop());
      currentStream.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const start = async () => {
      setError(null);
      try {
        const constraints: MediaStreamConstraints = {
          video: cameraDeviceId
            ? { deviceId: { exact: cameraDeviceId } }
            : {
                width:  { ideal: resolved.width,  max: resolved.width },
                height: { ideal: resolved.height, max: resolved.height },
              },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) { stream.getTracks().forEach(t=>t.stop()); return; }

        currentStream.current = stream;

        const v = videoRef.current!;
        v.onloadedmetadata = () => updateDims();
        v.srcObject = stream;
        await v.play().catch(() => {});
        setTimeout(updateDims, 100);

        const track = stream.getVideoTracks()[0];
        if (track) {
          try {
            await track.applyConstraints({ width: resolved.width, height: resolved.height });
            setTimeout(updateDims, 120);
          } catch { /* Kamera/Browser k�nnte es ignorieren */ }
        }
      } catch (e: unknown) {
        setError(e?.name ? `${e.name}: ${e.message || ""}` : (e?.message || "unknown camera error"));
      }
    };

    if (isStreaming) {
      stopTracks();
      start();
    } else {
      stopTracks();
      setDims({ w: 0, h: 0 });
    }

    return () => { cancelled = true; stopTracks(); };
  }, [isStreaming, cameraDeviceId, resolved.width, resolved.height]);

  // Laufende Gr��en�nderungen durchschieben
  useEffect(() => {
    if (!isStreaming) return;
    const track = currentStream.current?.getVideoTracks()?.[0];
    if (!track) return;
    (async () => {
      try {
        await track.applyConstraints({ width: resolved.width, height: resolved.height });
        setTimeout(updateDims, 120);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved.width, resolved.height]);

  // Mediapipe SelfieSegmentation lazy laden (nur wenn ben�tigt)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (bgMode === "none") {
        setSegmentationReady(false);
        return;
      }
      if (!segmentationRef.current) {
        try {
          const mod: unknown = await import("@mediapipe/selfie_segmentation");
          const SelfieSegmentation = mod.SelfieSegmentation;
          const sm = new SelfieSegmentation({
            locateFile: (file: string) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
          });
          sm.setOptions({ modelSelection: 1 }); // 0=landscape, 1=general
          // Zeichenroutine registrieren
          sm.onResults((results: unknown) => {
            const c = canvasRef.current;
            if (!c) return;
            const ctx = c.getContext("2d");
            if (!ctx) return;

            const vw = results.image.width;
            const vh = results.image.height;
            if (c.width !== vw || c.height !== vh) {
              c.width = vw;
              c.height = vh;
            }

            ctx.save();
            ctx.clearRect(0, 0, c.width, c.height);

            // 1) Maske zeichnen
            ctx.drawImage(results.segmentationMask, 0, 0, c.width, c.height);

            if (bgMode === "blur") {
              // Vordergrund (Person) scharf
              ctx.globalCompositeOperation = "source-in";
              ctx.filter = cssFilter; // S�ttigung/Kontrast
              ctx.drawImage(results.image, 0, 0, c.width, c.height);

              // Hintergrund weich
              ctx.globalCompositeOperation = "destination-over";
              ctx.filter = `blur(${blur}px) ${cssFilter}`;
              ctx.drawImage(results.image, 0, 0, c.width, c.height);
            } else {
              // "face-only": nur Person sichtbar, Hintergrund schwarz
              ctx.globalCompositeOperation = "source-in";
              ctx.filter = cssFilter;
              ctx.drawImage(results.image, 0, 0, c.width, c.height);
              // Option: Hintergrund leicht abdunkeln (nicht n�tig - already transparent/leer)
              // ctx.globalCompositeOperation = "destination-over";
              // ctx.fillStyle = "rgba(0,0,0,1)";
              // ctx.fillRect(0,0,c.width,c.height);
            }
            ctx.restore();
          });

          segmentationRef.current = sm;
          if (mounted) setSegmentationReady(true);
        } catch {
          segmentationRef.current = null;
          if (mounted) setSegmentationReady(false);
        }
      } else {
        if (mounted) setSegmentationReady(true);
      }
    })();
    return () => { mounted = true; };
  }, [bgMode, blur, cssFilter]);

  // Loop zum F�ttern der Segmentation (pro Frame send(image: video))
  useEffect(() => {
    // nur wenn Streaming + Modus aktiv + Instanz da
    if (!isStreaming || bgMode === "none" || !segmentationRef.current) {
      // Canvas-Loop ggf. stoppen
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    let running = true;
    const tick = async () => {
      if (!running) return;
      const v = videoRef.current;
      const sm = segmentationRef.current;
      const c = canvasRef.current;
      if (v && sm && c) {
        if (!processingRef.current) {
          try {
            processingRef.current = true;
            // send triggert onResults ? dort wird gezeichnet
            await sm.send({ image: v });
          } catch {
            // ignore
          } finally {
            processingRef.current = false;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isStreaming, bgMode, segmentationReady]);

  // Fallback-Canvas, wenn bgMode aktiv, aber Mediapipe nicht bereit
  useEffect(() => {
    if (!isStreaming) return;
    if (bgMode === "none") return;
    if (segmentationReady) return; // echte Segmentation �bernimmt

    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;

    const loop = () => {
      if (!running) return;
      const vw = v.videoWidth || 0, vh = v.videoHeight || 0;
      if (vw && vh) {
        if (c.width !== vw || c.height !== vh) { c.width = vw; c.height = vh; }
        if (bgMode === "blur") {
          ctx.filter = `blur(${blur}px) ${cssFilter}`;
          ctx.drawImage(v, 0, 0, vw, vh);
          ctx.filter = "none";
          ctx.globalAlpha = 0.7;
          ctx.drawImage(v, 0, 0, vw, vh);
          ctx.globalAlpha = 1;
        } else {
          // sehr einfacher "face-only"-Ersatz: Spotlight in der Mitte
          ctx.filter = `blur(${blur}px) ${cssFilter}`;
          ctx.drawImage(v, 0, 0, vw, vh);
          ctx.filter = "none";
          ctx.save();
          ctx.beginPath();
          const r = Math.min(vw, vh) * 0.35;
          ctx.arc(vw/2, vh/2, r, 0, Math.PI*2);
          ctx.clip();
          ctx.drawImage(v, 0, 0, vw, vh);
          ctx.restore();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(raf); };
  }, [isStreaming, bgMode, blur, cssFilter, segmentationReady]);

  return (
    <div className="video-section-root" style={{ position: "relative" }}>
      {/* Video sichtbar, wenn kein Canvas-Effekt */}
      <div
        className="video-frame"
        style={{ position: "relative", background: "#0b0b12", borderRadius: 8, overflow: "hidden" }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: bgMode === "none" ? cssFilter : "none",
            transform: mirror ? "scaleX(-1)" : "none",
            background: "#000",
            display: bgMode === "none" ? "block" : "none",
          }}
          onLoadedMetadata={updateDims}
        />

        {/* Canvas f�r Blur/Face-Only (sichtbar, wenn Effekt aktiv) */}
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: bgMode === "none" ? "none" : "block",
            transform: mirror ? "scaleX(-1)" : "none",
          }}
        />

        {/* LIVE-Badge */}
        {isStreaming && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "linear-gradient(135deg, #ff007a, #ff00c3)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 999,
              fontWeight: 700,
              boxShadow: "0 0 20px rgba(255,0,122,.35)",
            }}
          >
            ? LIVE
          </div>
        )}

        {/* echte Capture-Aufl�sung */}
        {dims.w > 0 && dims.h > 0 && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(0,0,0,.6)",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: 6,
              fontSize: 12,
            }}
          >
            {dims.w}�{dims.h}
          </div>
        )}

        {/* Hinweis, falls Segmentierung (noch) nicht bereit */}
        {bgMode !== "none" && !segmentationReady && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              background: "rgba(0,0,0,.6)",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: 6,
              fontSize: 12,
            }}
            title="Installiert: @mediapipe/selfie_segmentation - l�dt/initialisiert"
          >
            Segmentation l�dt . (Fallback aktiv)
          </div>
        )}
      </div>

      {/* error toast */}
      {error && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            borderRadius: 6,
            background: "#3a1d1d",
            color: "#ffdada",
            fontSize: 14,
          }}
        >
          Kamera-Fehler: {error}
        </div>
      )}
    </div>
  );
}

// Exporte
export default VideoSection;
export { VideoSection };
