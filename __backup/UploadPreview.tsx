
import React, { useEffect, useState, useRef } from 'react';
import './UploadPreview.css';

interface UploadPreviewProps {
  file: File;
  onPreviewGenerated?: (preview: string) => void;
  showMetadata?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

interface FileMetadata {
  dimensions?: { width: number; height: number };
  duration?: number;
  bitrate?: number;
  frameRate?: number;
  sampleRate?: number;
  channels?: number;
}

export const UploadPreview: React.FC<UploadPreviewProps> = ({
  file,
  onPreviewGenerated,
  showMetadata = true,
  size = 'medium',
  className = ''
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<FileMetadata>({});
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let revokedUrl: string | null = null;
    const run = async () => {
      setIsGenerating(true);
      setError(null);
      try {
        if (file.type.startsWith('image/')) {
          const { url, meta } = await generateImagePreview(file);
          revokedUrl = url.startsWith('blob:') ? url : null;
          setPreview(url);
          setMetadata(meta);
          onPreviewGenerated?.(url);
        } else if (file.type.startsWith('video/')) {
          const { url, meta } = await generateVideoPreview(file);
          setPreview(url);
          setMetadata(meta);
          onPreviewGenerated?.(url);
        } else if (file.type.startsWith('audio/')) {
          const { url, meta } = await generateAudioWaveform(file);
          setPreview(url);
          setMetadata(meta);
          onPreviewGenerated?.(url);
        } else {
          setPreview(null);
          setMetadata({});
          onPreviewGenerated?.('');
        }
      } catch (e) {
        setError('Vorschau konnte nicht generiert werden');
        setPreview(null);
        onPreviewGenerated?.('');
      } finally {
        setIsGenerating(false);
      }
    };
    run();
    return () => { if (revokedUrl) URL.revokeObjectURL(revokedUrl); };
  }, [file]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateImagePreview = (f: File): Promise<{ url: string; meta: FileMetadata }> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        resolve({ url, meta: { dimensions: { width: img.naturalWidth, height: img.naturalHeight } } });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const generateVideoPreview = (f: File): Promise<{ url: string; meta: FileMetadata }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(f);
      video.preload = 'metadata';
      video.muted = true;
      video.onloadedmetadata = () => {
        const meta: FileMetadata = {
          dimensions: { width: video.videoWidth, height: video.videoHeight },
          duration: video.duration,
          frameRate: 30
        };
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Seek to 10% or 0.1s minimum to avoid black frames
        video.currentTime = Math.max(0.1, video.duration * 0.1);
        video.onseeked = () => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            URL.revokeObjectURL(url);
            resolve({ url: dataUrl, meta });
          } else {
            URL.revokeObjectURL(url);
            reject(new Error('Canvas context not available'));
          }
        };
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Video konnte nicht geladen werden'));
      };
      video.src = url;
      video.load();
    });
  };

  const generateAudioWaveform = async (f: File): Promise<{ url: string; meta: FileMetadata }> => {
    const arrayBuffer = await f.arrayBuffer();
    const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextCtor();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const canvas = canvasRef.current || document.createElement('canvas');
    const width = 300, height = 100;
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(0, amp);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;

    for (let i = 0; i < width; i++) {
      let min = 1.0, max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.lineTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/png');
    audioContext.close();

    return {
      url: dataUrl,
      meta: { duration: audioBuffer.duration, sampleRate: audioBuffer.sampleRate, channels: audioBuffer.numberOfChannels }
    };
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    if (mimeType.includes('text')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`upload-preview ${size} ${className}`}>
      <div className="preview-container">
        {isGenerating ? (
          <div className="preview-loading">
            <div className="loading-spinner" />
            <span>Vorschau wird generiert...</span>
          </div>
        ) : error ? (
          <div className="preview-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        ) : preview ? (
          <div className="preview-image">
            <img src={preview} alt={file.name} />
            {file.type.startsWith('video/') && (
              <div className="preview-overlay">
                <span className="play-icon">▶️</span>
              </div>
            )}
          </div>
        ) : (
          <div className="preview-icon">
            <span className="file-type-icon">{getFileIcon(file.type)}</span>
          </div>
        )}
      </div>

      {showMetadata && (
        <div className="preview-metadata">
          <div className="metadata-name" title={file.name}>{file.name}</div>
          <div className="metadata-info">
            <span className="metadata-size">{formatFileSize(file.size)}</span>
            {metadata.dimensions && (
              <span className="metadata-dimensions">
                {metadata.dimensions.width} × {metadata.dimensions.height}
              </span>
            )}
            {metadata.duration && (
              <span className="metadata-duration">{formatDuration(metadata.duration)}</span>
            )}
            {metadata.sampleRate && (
              <span className="metadata-sample-rate">{Math.round(metadata.sampleRate / 1000)}kHz</span>
            )}
            {metadata.channels && (
              <span className="metadata-channels">
                {metadata.channels === 1 ? 'Mono' : 'Stereo'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Hidden canvas for preview generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};
