import React, { useState, useRef, useEffect, useCallback } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onSeeking?: () => void;
  onSeeked?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  volume?: number;
  playbackRate?: number;
  startTime?: number;
  endTime?: number;
  showControls?: boolean;
  showOverlay?: boolean;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  currentTime: externalTime,
  onTimeUpdate,
  onDurationChange,
  onPlay,
  onPause,
  onEnded,
  onSeeking,
  onSeeked,
  autoPlay = false,
  loop = false,
  muted = false,
  volume: initialVolume = 1,
  playbackRate: initialRate = 1,
  startTime = 0,
  endTime,
  showControls = true,
  showOverlay = true,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(muted);
  const [playbackRate, setPlaybackRate] = useState(initialRate);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showPlaybackMenu, setShowPlaybackMenu] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number>();
  const seekingRef = useRef(false);

  // Sync with external time
  useEffect(() => {
    if (externalTime !== undefined && videoRef.current && !seekingRef.current) {
      videoRef.current.currentTime = externalTime;
    }
  }, [externalTime]);

  // Set initial properties
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = volume;
    videoRef.current.muted = isMuted;
    videoRef.current.playbackRate = playbackRate;
    if (startTime > 0) {
      videoRef.current.currentTime = startTime;
    }
  }, []);

  // Auto-hide controls
  useEffect(() => {
    const hideControls = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isPlaying && showControls) {
        controlsTimeoutRef.current = window.setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
      }
    };

    const onMouseMove = () => {
      setControlsVisible(true);
      hideControls();
    };
    const onMouseLeave = () => {
      if (isPlaying) setControlsVisible(false);
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener('mousemove', onMouseMove);
      el.addEventListener('mouseleave', onMouseLeave);
    }
    hideControls();

    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (el) {
        el.removeEventListener('mousemove', onMouseMove);
        el.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, [isPlaying, showControls]);

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    onTimeUpdate?.(time);
    // End segment handling
    if (endTime && time >= endTime) {
      videoRef.current.pause();
      if (loop) {
        videoRef.current.currentTime = startTime;
        videoRef.current.play();
      }
    }
  }, [endTime, startTime, loop, onTimeUpdate]);

  // Handle duration change
  const handleDurationChange = useCallback(() => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || 0;
    setDuration(dur);
    onDurationChange?.(dur);
  }, [onDurationChange]);

  // Play/Pause
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
  }, [isPlaying]);

  // Seek
  const handleSeek = useCallback((time: number) => {
    if (!videoRef.current) return;
    seekingRef.current = true;
    const clamped = Math.max(0, Math.min(duration || 0, time));
    videoRef.current.currentTime = clamped;
  }, [duration]);

  // Volume
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!videoRef.current) return;
    const vol = Math.max(0, Math.min(1, newVolume));
    videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  }, []);

  // Mute/Unmute
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  }, [isMuted]);

  // Playback Rate
  const changePlaybackRate = useCallback((rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowPlaybackMenu(false);
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!isFullscreen) await containerRef.current.requestFullscreen();
    else await document.exitFullscreen();
  }, [isFullscreen]);

  // Picture in Picture
  const togglePictureInPicture = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      // @ts-ignore - not all TS libs include PiP types
      if (!document.pictureInPictureElement) {
        // @ts-ignore
        await videoRef.current.requestPictureInPicture();
      } else {
        // @ts-ignore
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error('PiP not supported:', error);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(currentTime + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(volume - 0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'p':
          e.preventDefault();
          togglePictureInPicture();
          break;
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
          e.preventDefault();
          const percent = parseInt(e.key, 10) * 0.1;
          handleSeek((duration || 0) * percent);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, handleSeek, handleVolumeChange, toggleMute, toggleFullscreen, togglePictureInPicture, currentTime, duration, volume]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Listen for PiP changes
  useEffect(() => {
    // @ts-ignore
    const onEnter = () => setIsPictureInPicture(true);
    // @ts-ignore
    const onLeave = () => setIsPictureInPicture(false);
    const el = videoRef.current;
    if (el) {
      // @ts-ignore
      el.addEventListener('enterpictureinpicture', onEnter);
      // @ts-ignore
      el.addEventListener('leavepictureinpicture', onLeave);
    }
    return () => {
      if (el) {
        // @ts-ignore
        el.removeEventListener('enterpictureinpicture', onEnter);
        // @ts-ignore
        el.removeEventListener('leavepictureinpicture', onLeave);
      }
    };
  }, []);

  // Format time
  const formatTime = (seconds: number): string => {
    const safe = Math.max(0, seconds || 0);
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const s = Math.floor(safe % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Get volume icon
  const getVolumeIcon = (): string => {
    if (isMuted || volume === 0) return '🔇';
    if (volume < 0.3) return '🔈';
    if (volume < 0.7) return '🔉';
    return '🔊';
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className={`video-player ${className} ${isFullscreen ? 'fullscreen' : ''} ${controlsVisible ? '' : 'controls-hidden'}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        onPlay={() => { setIsPlaying(true); onPlay?.(); }}
        onPause={() => { setIsPlaying(false); onPause?.(); }}
        onEnded={() => { setIsPlaying(false); onEnded?.(); }}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onSeeking={() => onSeeking?.()}
        onSeeked={() => { seekingRef.current = false; onSeeked?.(); }}
        onLoadStart={() => setIsLoading(true)}
        onLoadedData={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        className="video-element"
        playsInline
        muted={isMuted}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="video-loading" aria-label="Ladevorgang">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Overlay */}
      {showOverlay && (
        <div 
          className="video-overlay"
          onClick={togglePlayPause}
          role="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {!isPlaying && !isLoading && (
            <div className="play-overlay">
              <span className="play-icon">▶️</span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className={`video-controls ${controlsVisible ? 'visible' : ''}`}>
          {/* Progress Bar */}
          <div className="progress-container">
            <input
              type="range"
              className="progress-bar"
              min={0}
              max={duration || 0}
              value={currentTime}
              disabled={!duration}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              style={{
                background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${progress}%, rgba(255, 255, 255, 0.2) ${progress}%, rgba(255, 255, 255, 0.2) 100%)`
              }}
              aria-valuemin={0}
              aria-valuemax={duration || 0}
              aria-valuenow={currentTime}
              aria-label="Fortschritt"
            />
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="control-buttons">
            <div className="controls-left">
              {/* Play/Pause */}
              <button
                className="control-btn play-pause"
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                type="button"
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>

              {/* Volume */}
              <div 
                className="volume-control"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  className="control-btn volume-btn"
                  onClick={toggleMute}
                  aria-label="Volume"
                  type="button"
                >
                  {getVolumeIcon()}
                </button>
                {showVolumeSlider && (
                  <div className="volume-slider-container">
                    <input
                      type="range"
                      className="volume-slider"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      aria-label="Lautstärke"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="controls-right">
              {/* Playback Speed */}
              <div className="playback-control">
                <button
                  className="control-btn"
                  onClick={() => setShowPlaybackMenu(!showPlaybackMenu)}
                  aria-label="Wiedergabegeschwindigkeit"
                  type="button"
                >
                  {playbackRate}x
                </button>
                {showPlaybackMenu && (
                  <div className="playback-menu" role="menu">
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                      <button
                        key={rate}
                        className={`menu-item ${playbackRate === rate ? 'active' : ''}`}
                        onClick={() => changePlaybackRate(rate)}
                        type="button"
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Picture in Picture */}
              <button
                className="control-btn"
                onClick={togglePictureInPicture}
                aria-label="Picture in Picture"
                type="button"
              >
                {isPictureInPicture ? '⊡' : '⧉'}
              </button>

              {/* Fullscreen */}
              <button
                className="control-btn"
                onClick={toggleFullscreen}
                aria-label="Fullscreen"
                type="button"
              >
                {isFullscreen ? '⊡' : '⊞'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
