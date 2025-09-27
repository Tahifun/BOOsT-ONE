
import React, { useEffect, useState } from 'react';
import './UploadProgress.css';

interface UploadProgressProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  showSpeed?: boolean;
  speed?: number; // bytes per second
  remainingTime?: number; // seconds
  uploadedBytes?: number;
  totalBytes?: number;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  variant?: 'default' | 'success' | 'warning' | 'error';
  animated?: boolean;
  className?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  label,
  showPercentage = false,
  showSpeed = false,
  speed,
  remainingTime,
  uploadedBytes,
  totalBytes,
  size = 'medium',
  variant = 'default',
  animated = true,
  className = ''
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Animate progress changes
  useEffect(() => {
    if (!animated) {
      setDisplayProgress(progress);
      setIsComplete(progress >= 100);
      return;
    }
    const animationDuration = 300; // ms
    const steps = 30;
    const stepDuration = animationDuration / steps;
    const start = displayProgress;
    const delta = progress - start;
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayProgress(progress);
        setIsComplete(progress >= 100);
        clearInterval(interval);
      } else {
        const next = start + (delta * (currentStep / steps));
        setDisplayProgress(next);
      }
    }, stepDuration);
    return () => clearInterval(interval);
  }, [progress, animated]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatFileSize = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (seconds?: number): string => {
    if (!seconds || !Number.isFinite(seconds) || seconds === Infinity) return '--:--';
    if (seconds < 60) return `${Math.max(0, Math.floor(seconds))}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins < 60) return `${mins}:${secs.toString().padStart(2, '0')}`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSpeed = (bytesPerSecond?: number): string => {
    if (!bytesPerSecond) return '-- MB/s';
    return formatFileSize(bytesPerSecond) + '/s';
  };

  const getVariantClass = () => {
    if (isComplete) return 'complete';
    if (variant !== 'default') return variant;
    if (progress >= 75) return 'high';
    if (progress >= 50) return 'medium';
    if (progress >= 25) return 'low';
    return 'default';
  };

  const glowIntensity = Math.min(1, progress / 100 + 0.3);

  return (
    <div className={`upload-progress ${size} ${className}`} aria-busy={!isComplete}>
      {(label || showSpeed || remainingTime) && (
        <div className="progress-header">
          {label && <span className="progress-label">{label}</span>}
          <div className="progress-stats">
            {showSpeed && speed && (
              <span className="progress-speed">{formatSpeed(speed)}</span>
            )}
            {remainingTime !== undefined && (
              <span className="progress-time">{formatTime(remainingTime)}</span>
            )}
            {uploadedBytes !== undefined && totalBytes !== undefined && (
              <span className="progress-bytes">
                {formatFileSize(uploadedBytes)} / {formatFileSize(totalBytes)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="progress-container">
        <div className="progress-track">
          <div 
            className="progress-glow" 
            style={{ opacity: glowIntensity, width: `${displayProgress}%` }}
          />
          
          <div
            className={`progress-fill ${getVariantClass()} ${animated ? 'animated' : ''}`}
            style={{ width: `${displayProgress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(displayProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label || 'Upload-Fortschritt'}
          >
            {animated && !isComplete && <div className="progress-stripes" />}
            {!isComplete && displayProgress > 0 && displayProgress < 100 && (
              <div className="progress-edge" />
            )}
          </div>

          {showPercentage && (
            <div className="progress-text">
              <span className="progress-percentage">
                {Math.round(displayProgress)}%
              </span>
            </div>
          )}

          {isComplete && (
            <div className="progress-complete" aria-hidden="true">
              <span className="complete-icon">?</span>
            </div>
          )}
        </div>

        {animated && !isComplete && displayProgress > 0 && displayProgress < 100 && (
          <div className="progress-particles" aria-hidden="true">
            <span className="particle particle-1" />
            <span className="particle particle-2" />
            <span className="particle particle-3" />
          </div>
        )}
      </div>

      {size !== 'tiny' && (uploadedBytes !== undefined || showPercentage) && (
        <div className="progress-footer">
          {uploadedBytes !== undefined && totalBytes !== undefined && (
            <div className="progress-details">
              <span className="uploaded">{formatFileSize(uploadedBytes)}</span>
              <span className="separator">/</span>
              <span className="total">{formatFileSize(totalBytes)}</span>
            </div>
          )}
          {showPercentage && !isComplete && (
            <div className="progress-estimate">
              {remainingTime && Number.isFinite(remainingTime) && remainingTime < Infinity && (
                <span className="remaining">
                  Verbleibend: {formatTime(remainingTime)}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
