
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileValidator } from './FileValidator';
import './DropZone.css';

export interface FileWithValidation {
  file: File;
  id: string;
  valid: boolean;
  errors: string[];
  preview?: string;
  metadata?: unknown;
}

interface DropZoneProps {
  onFilesSelected: (files: FileWithValidation[]) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in bytes
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  acceptedTypes = ['video/*', 'image/*', 'audio/*'],
  maxSize = 250 * 1024 * 1024, // 250MB default
  maxFiles = 10,
  multiple = true,
  disabled = false,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const validatorRef = useRef(new FileValidator({ acceptedTypes, maxSize }));

  // keep validator in sync with props
  useEffect(() => {
    validatorRef.current.updateConfig({ acceptedTypes, maxSize });
  }, [acceptedTypes, maxSize]);

  // drag helpers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => Math.max(0, prev + 1));
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const next = Math.max(0, prev - 1);
      if (next == 0) setIsDragging(false);
      return next;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  }, []);

  // paste support (handy for screenshots)
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      if (disabled) return;
      if (!e.clipboardData) return;
      const files = Array.from(e.clipboardData.files || []);
      if (files.length) {
        await processFiles(files as unknown as FileList | File[]);
      }
    };
    const el = dropZoneRef.current;
    el?.addEventListener('paste', onPaste as any);
    return () => el?.removeEventListener('paste', onPaste as any);
  }, [disabled]);

  // Process files
  const processFiles = async (fileList: FileList | File[]) => {
    if (disabled) return;

    setIsValidating(true);
    const files = Array.from(fileList).slice(0, multiple ? maxFiles : 1);
    const processedFiles: FileWithValidation[] = [];

    for (const file of files) {
      const validation = await validatorRef.current.validateFile(file);
      const fileId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? (crypto as any).randomUUID()
          : `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Previews (bounded to reduce memory)
      let preview: string | undefined;
      try {
        if (file.type.startsWith('image/')) {
          preview = await generateImagePreview(file, 1024);
        } else if (file.type.startsWith('video/')) {
          preview = await generateVideoPreview(file, 480);
        }
      } catch {
        preview = undefined;
      }

      processedFiles.push({
        file,
        id: fileId,
        valid: validation.valid,
        errors: validation.errors,
        preview,
        metadata: validation.metadata
      });
    }

    setIsValidating(false);
    onFilesSelected(processedFiles);
  };

  // Handle drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(files);
      e.dataTransfer.clearData();
    }
  }, [disabled, multiple, maxFiles]);

  // Handle file selection via input
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Generate image preview (scaled)
  const generateImagePreview = (file: File, maxDim = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(url);
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
      img.src = url;
    });
  };

  // Generate video preview (first frame, scaled)
  const generateVideoPreview = (file: File, targetWidth = 480): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const url = URL.createObjectURL(file);
      video.preload = 'metadata';
      (video as any).playsInline = true;
      (video as any).muted = true;
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(0.1, Math.max(0, (video.duration || 1) * 0.05));
      };
      video.onseeked = () => {
        const ratio = video.videoWidth / video.videoHeight || 1;
        const w = Math.min(targetWidth, video.videoWidth || targetWidth);
        const h = Math.round(w / ratio);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, w, h);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        } catch {
          resolve('');
        }
        URL.revokeObjectURL(url);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
      video.src = url;
    });
  };

  // Open file picker
  const openFilePicker = () => {
    if (!disabled && fileInputRef.current) fileInputRef.current.click();
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Get accepted file extensions
  const getAcceptedExtensions = (): string => acceptedTypes.join(', ');

  return (
    <div
      ref={dropZoneRef}
      className={`drop-zone ${className} ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''} ${isValidating ? 'validating' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Datei-Upload-Bereich"
      aria-disabled={disabled}
      aria-busy={isValidating}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openFilePicker();
        }
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="file-input-hidden"
        onChange={handleFileSelect}
        accept={getAcceptedExtensions()}
        multiple={multiple}
        disabled={disabled}
        aria-hidden="true"
      />

      {/* Drop zone content */}
      <div className="drop-zone-content">
        {/* Animated background effect */}
        <div className="drop-zone-background" aria-hidden="true">
          <div className="drop-zone-pulse" />
          <div className="drop-zone-glow" />
        </div>

        {/* Icon */}
        <div className="drop-zone-icon">
          {isValidating ? (
            <div className="validating-spinner" />
          ) : isDragging ? (
            <span className="icon-dropping" aria-hidden="true"></span>
          ) : (
            <span className="icon-upload" aria-hidden="true"></span>
          )}
        </div>

        {/* Text */}
        <div className="drop-zone-text">
          {isValidating ? (
            <>
              <h3>Validiere Dateien...</h3>
              <p>Bitte warten</p>
            </>
          ) : isDragging ? (
            <>
              <h3>Loslassen zum Hochladen!</h3>
              <p>Die Dateien werden hier abgelegt</p>
            </>
          ) : (
            <>
              <h3>Dateien hier ablegen</h3>
              <p>oder</p>
              <button 
                className="select-files-btn"
                onClick={openFilePicker}
                disabled={disabled}
                type="button"
              >
                Dateien ausw�hlen
              </button>
            </>
          )}
        </div>

        {/* Info */}
        {!isValidating && !isDragging && (
          <div className="drop-zone-info" aria-live="polite">
            <p className="info-text">
              Unterst�tzte Formate: <span className="info-highlight">MP4, MOV, PNG, JPG, MP3, WAV</span>
            </p>
            <p className="info-text">
              Maximale Dateigr�e: <span className="info-highlight">{formatFileSize(maxSize)}</span>
            </p>
            {multiple && (
              <p className="info-text">
                Maximale Anzahl: <span className="info-highlight">{maxFiles} Dateien</span>
              </p>
            )}
          </div>
        )}

        {/* Drag indicator */}
        {isDragging && (
          <div className="drag-indicator" aria-hidden="true">
            <div className="drag-border" />
            <div className="drag-corners">
              <span className="corner top-left" />
              <span className="corner top-right" />
              <span className="corner bottom-left" />
              <span className="corner bottom-right" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

