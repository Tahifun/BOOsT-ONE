// src/pages/EpicLivestream.tsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";

// Hooks
import { useLivestream } from '../hooks/useLivestream';
import { useTheme } from '../hooks/useTheme';
import { useModeration } from '../hooks/useModeration';
import { useModerationSettings } from '../hooks/useModerationSettings';
import { useAuth } from '../contexts/AuthContext';

// Shared UI
import ErrorBoundary from '../components/shared/ErrorBoundary';
import Button from '../components/shared/Button/Button';

// Epic Components
import { AnimatedBackground } from '../components/epic/AnimatedBackground';
import ParticleSystem from '../components/epic/ParticleSystem';
import { DevicePanel } from '../components/epic/DevicePanel';
import { EffectsPanel } from '../components/epic/EffectsPanel';
import { SizeControlsPanel } from '../components/epic/SizeControlsPanel';
import { ModerationSection } from '../components/epic/ModerationSection';
import { PollPanel } from '../components/epic/PollPanel';
import { StatsBar } from '../components/epic/StatsBar';
import VideoSection from '../components/epic/VideoSection';
import GoLiveChecklist from '../components/epic/GoLiveChecklist';

// Styles
import "../styles/epic/EpicLivestream.css";
import "../styles/epic/ModerationSection.css";

// Types
type ChatMessage = {
  id: string;
  user: string;
  message: string;
  timestamp: number;
  type?: "normal" | "gift" | "super";
  giftAmount?: number;
};

type PixelSize = { width: number; height: number };

type Reaction = {
  id: string;
  emoji: string;
  timestamp: number;
};

function mapHookSizeToPixels(s: unknown): PixelSize {
  switch (s) {
    case "S":
      return { width: 1280, height: 720 };
    case "L":
      return { width: 3840, height: 2160 };
    case "M":
    default:
      return { width: 1920, height: 1080 };
  }
}

// Compatibility Bridge for Moderation
const callCheckBool = (fn: unknown, msg: ChatMessage): boolean => {
  const f = fn as (arg: unknown) => any;
  if (typeof f !== "function") return false;
  try {
    const res = f(msg);
    if (typeof res === "boolean") return res;
    if (typeof res === "number") return res > 0;
  } catch {}
  try {
    const res2 = f(msg.message ?? "");
    if (typeof res2 === "boolean") return res2;
    if (typeof res2 === "number") return res2 > 0;
  } catch {}
  return false;
};

const callCheckToxic = (fn: unknown, msg: ChatMessage): number | boolean => {
  const f = fn as (arg: unknown) => any;
  if (typeof f !== "function") return false;
  try {
    const res = f(msg);
    return res;
  } catch {}
  try {
    const res2 = f(msg.message ?? "");
    return res2;
  } catch {}
  return false;
};

const EpicLivestream: React.FC = () => {
  const { setTheme } = useTheme();
  const { currentUser } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Livestream Hook
  const {
    showChat,
    setShowChat,
    isStreaming,
    setIsStreaming,
    deviceSettings,
    setDeviceSettings,
    effectSettings,
    setEffectSettings,
    stats,
    size,
    setSize,
  } = useLivestream();

  // Moderation (laufende Checks/Stats)
  const {
    processMessage,
    isRaidMode,
    slowModeDelay,
    queue,
    drawGiveawayWinner,
    addModAction,
    getStats: getModStats,
    checkSpam,
    checkLinks,
    checkBannedWords,
    checkToxicity,
  } = useModeration();

  // Gemeinsame Moderationseinstellungen/Preset-Status
  const { activePreset } = useModerationSettings();

  // State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChecklist, setShowChecklist] = useState<boolean>(true);
  const [chatInput, setChatInput] = useState<string>("");
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [chatOpacity, setChatOpacity] = useState<number>(100);

  // Theme
  useEffect(() => {
    setTheme("epic");
  }, [setTheme]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Simulate incoming messages for demo
  useEffect(() => {
    if (!isStreaming) return;

    const demoMessages = [
      { user: "QuantumGamer", message: "This stream is INCREDIBLE! ??", type: "normal" as const },
      { user: "CyberNinja", message: "The quality is insane!", type: "normal" as const },
      { user: "NeonDreamer", message: "Sent you a gift! ??", type: "gift" as const, giftAmount: 100 },
      { user: "PixelMaster", message: "EPIC CONTENT! ??", type: "normal" as const },
      { user: "TechGuru", message: "Best stream interface ever!", type: "super" as const },
      { user: "GlitchKing", message: "The effects are mind-blowing ??", type: "normal" as const },
      { user: "FutureVibes", message: "This is the future of streaming!", type: "normal" as const },
      { user: "HoloPlayer", message: "Quantum dimension activated! ?", type: "normal" as const },
    ];

    const interval = setInterval(() => {
      const randomMsg =
        demoMessages[Math.floor(Math.random() * demoMessages.length)];
      const newMessage: ChatMessage = {
        id: `demo-${Date.now()}-${Math.random()}`,
        user: randomMsg.user,
        message: randomMsg.message,
        timestamp: Date.now(),
        type: randomMsg.type,
        giftAmount: randomMsg.giftAmount,
      };
      setChatMessages((prev) => [...prev.slice(-50), newMessage]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Simulate reactions
  useEffect(() => {
    if (!isStreaming) return;

    const emojis = ["??", "??", "?", "??", "??", "??", "??", "??"];

    const interval = setInterval(() => {
      const newReaction: Reaction = {
        id: `reaction-${Date.now()}-${Math.random()}`,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        timestamp: Date.now(),
      };
      setReactions((prev) => [...prev, newReaction]);

      // Clean old reactions
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 4000);
    }, 800);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Device settings
  const safeDeviceSettings = useMemo(
    () => ({
      selectedCamera:
        deviceSettings.camId ?? deviceSettings.selectedCamera ?? "",
      selectedMic: deviceSettings.micId ?? deviceSettings.selectedMic ?? "",
      resolution: deviceSettings.resolution ?? "720p",
      frameRate: deviceSettings.frameRate ?? 30,
      mirror: deviceSettings.mirror ?? false,
      showChat: deviceSettings.showChat ?? showChat,
    }),
    [deviceSettings, showChat]
  );

  // Effect settings
  const safeEffectSettings = useMemo(
    () => ({
      blur:
        typeof (effectSettings as any).blur === "number"
          ? (effectSettings as any).blur
          : typeof (effectSettings as any).blurIntensity === "number"
          ? (effectSettings as any).blurIntensity
          : 0,
      saturation:
        typeof (effectSettings as any).saturation === "number"
          ? (effectSettings as any).saturation
          : typeof (effectSettings as any).brightness === "number"
          ? (effectSettings as any).brightness / 100
          : 1,
      contrast:
        typeof (effectSettings as any).contrast === "number"
          ? (effectSettings as any).contrast > 2
            ? (effectSettings as any).contrast / 100
            : (effectSettings as any).contrast
          : 1,
      backgroundMode:
        (effectSettings as any).backgroundMode ??
        ((effectSettings as any).mode as any) ??
        "none",
      mirror: (effectSettings as any).mirror ?? false,
      faceDetection: (effectSettings as any).faceDetection ?? false,
    }),
    [effectSettings]
  );

  // Size in pixels
  const resolvedSizeForVideo: PixelSize = useMemo(
    () => mapHookSizeToPixels(size),
    [size]
  );

  // Moderator name
  const moderatorName =
    currentUser?.displayName || currentUser?.email || "system";

  // Handle chat send
  const handleChatSend = useCallback(() => {
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      user: currentUser?.displayName || "User",
      message: chatInput,
      timestamp: Date.now(),
      type: "normal",
    };

    // Moderation checks
    const isSpam = callCheckBool(checkSpam, newMessage);
    const hasLinks = callCheckBool(checkLinks, newMessage);
    const hasBanned = callCheckBool(checkBannedWords, newMessage);
    const toxic = callCheckToxic(checkToxicity, newMessage);
    const isToxic = typeof toxic === "number" ? toxic > 0.8 : !!toxic;

    if (isSpam || hasLinks || hasBanned || isToxic) {
      const reasons: string[] = [];
      if (isSpam) reasons.push("spam");
      if (hasLinks) reasons.push("links");
      if (hasBanned) reasons.push("banned-words");
      if (isToxic) reasons.push("toxic");

      addModAction({
        type: "delete",
        user: newMessage.user,
        moderator: moderatorName,
        reason: reasons.join(", "),
      });

      // Show warning message
      const warningMsg: ChatMessage = {
        id: `warning-${Date.now()}`,
        user: "System",
        message: "?? Message blocked by moderation",
        timestamp: Date.now(),
        type: "normal",
      };
      setChatMessages((prev) => [...prev, warningMsg]);
      setChatInput("");
      return;
    }

    // Process and add message
    processMessage(newMessage as any);
    setChatMessages((prev) => [...prev.slice(-50), newMessage]);
    setChatInput("");
  }, [
    chatInput,
    currentUser,
    checkSpam,
    checkLinks,
    checkBannedWords,
    checkToxicity,
    addModAction,
    moderatorName,
    processMessage,
  ]);

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChatSend();
      }
    },
    [handleChatSend]
  );

  // Handle draw winner
  const handleDrawWinner = useCallback(() => {
    const winner = drawGiveawayWinner();
    if (!winner) return;
    const msg: ChatMessage = {
      id: `${Date.now()}`,
      user: "System",
      message: `?? Winner: ${winner.user} - Congratulations!`,
      timestamp: Date.now(),
      type: "super",
    };
    setChatMessages((prev) => [...prev, msg]);
  }, [drawGiveawayWinner]);

  // Start/Stop handlers
  const handleStart = useCallback(() => setIsStreaming(true), [setIsStreaming]);
  const handleStop = useCallback(() => setIsStreaming(false), [setIsStreaming]);

  // Combined stats
  const modStats = getModStats();
  const combinedStats = {
    viewers: stats?.viewers ?? 0,
    likes: stats?.likes ?? 0,
    gifts: stats?.gifts ?? 0,
    streamTime: (stats as any)?.streamTime ?? 0,
    audioLevel: (stats as any)?.audioLevel ?? 0,
    connectionQuality: (stats as any)?.connectionQuality ?? "good",
    modActions: modStats.totalActions,
    timeouts: modStats.timeouts,
    bans: modStats.bans,
    queueSize: modStats.queueSize,
    isRaidMode: modStats.isRaidMode,
  };

  return (
    <ErrorBoundary>
      <div className="epic-livestream-container epic-live">
        {showChecklist && (
          <GoLiveChecklist onComplete={() => setShowChecklist(false)} />
        )}

        <AnimatedBackground />
        <ParticleSystem />

        <div className="epic-grid">
          {/* Header */}
          <header className="epic-header">
            <div className="epic-logo">
              CLIP BOOST QUANTUM
              {activePreset ? ` . ${activePreset.toUpperCase()}` : ""}
            </div>

            <div className="header-actions">
              {!isStreaming ? (
                <button
                  className="header-btn"
                  onClick={handleStart}
                  title="Start Stream"
                >
                  ? START
                </button>
              ) : (
                <button
                  className="header-btn"
                  onClick={handleStop}
                  title="Stop Stream"
                >
                  ? STOP
                </button>
              )}

              <Button
                className="header-btn"
                onClick={() => setShowChat(!showChat)}
              >
                {showChat ? "HIDE CHAT" : "SHOW CHAT"}
              </Button>
            </div>
          </header>

          {/* Control Panels */}
          <section className="control-panels-grid">
            <div className="section-card">
              <DevicePanel
                settings={{
                  camId: safeDeviceSettings.selectedCamera,
                  micId: safeDeviceSettings.selectedMic,
                  resolution: safeDeviceSettings.resolution,
                  showChat,
                }}
                onSettingsChange={(next) => {
                  setDeviceSettings({
                    ...deviceSettings,
                    camId: next.camId,
                    micId: next.micId,
                    resolution: next.resolution,
                    showChat: next.showChat,
                  });
                  if (typeof next.showChat === "boolean") {
                    setShowChat(!!next.showChat);
                  }
                }}
              />
            </div>

            <div className="section-card">
              <EffectsPanel
                settings={{
                  mode: (safeEffectSettings.backgroundMode as any) ?? "none",
                  blurIntensity:
                    typeof safeEffectSettings.blur === "number"
                      ? safeEffectSettings.blur
                      : 0,
                  brightness:
                    typeof (effectSettings as any).brightness === "number"
                      ? (effectSettings as any).brightness
                      : Math.round((safeEffectSettings.saturation ?? 1) * 100),
                  contrast:
                    typeof (effectSettings as any).contrast === "number"
                      ? (effectSettings as any).contrast
                      : Math.round((safeEffectSettings.contrast ?? 1) * 100),
                  mirror: !!(effectSettings as any).mirror,
                  faceDetection: !!(effectSettings as any).faceDetection,
                }}
                onSettingsChange={(next) => {
                  setEffectSettings({
                    ...effectSettings,
                    mode: next.mode,
                    blurIntensity: next.blurIntensity,
                    brightness: next.brightness,
                    contrast: next.contrast,
                    mirror: next.mirror,
                    faceDetection: next.faceDetection,
                  });
                }}
              />

              {/* Chat Transparency Control */}
              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  background: "rgba(0, 255, 255, 0.05)",
                  borderRadius: "10px",
                  border: "1px solid rgba(0, 255, 255, 0.2)",
                }}
              >
                <label
                  style={{
                    display: "block",
                    color: "#00ffff",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    marginBottom: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Chat Transparenz: {chatOpacity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={chatOpacity}
                  onChange={(e) => setChatOpacity(Number(e.target.value))}
                  style={{
                    width: "100%",
                    height: "6px",
                    background: `linear-gradient(to right, 
                      rgba(0, 255, 255, 0.2) 0%, 
                      rgba(0, 255, 255, 0.8) ${chatOpacity}%, 
                      rgba(255, 255, 255, 0.1) ${chatOpacity}%, 
                      rgba(255, 255, 255, 0.1) 100%)`,
                    borderRadius: "3px",
                    outline: "none",
                    WebkitAppearance: "none",
                    cursor: "pointer",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    fontSize: "0.75rem",
                    color: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  <span>Unsichtbar</span>
                  <span>Voll sichtbar</span>
                </div>
              </div>
            </div>

            <div className="section-card">
              <SizeControlsPanel
                size={size}
                onSizeChange={(s) => setSize(s as any)}
                isStreaming={isStreaming}
                onStartStream={handleStart}
                onStopStream={handleStop}
                onPanic={() => {
                  setEffectSettings({
                    mode: "none",
                    blurIntensity: 0,
                    brightness: 100,
                    contrast: 100,
                    mirror: false,
                    faceDetection: false,
                  } as any);
                }}
                onTakeScreenshot={() => {
                  const msg: ChatMessage = {
                    id: `${Date.now()}`,
                    user: "System",
                    message: "?? Screenshot captured!",
                    timestamp: Date.now(),
                    type: "normal",
                  };
                  setChatMessages((prev) => [...prev, msg]);
                }}
                onStartRecording={() => {
                  const msg: ChatMessage = {
                    id: `${Date.now()}`,
                    user: "System",
                    message: "?? Recording started!",
                    timestamp: Date.now(),
                    type: "normal",
                  };
                  setChatMessages((prev) => [...prev, msg]);
                }}
              />
            </div>
          </section>

          {/* Main Video Section with Integrated Chat */}
          <section className="video-chat-section">
            <div className="section-card preview-stage">
              {/* Video Component */}
              <div className="video-wrapper">
                <VideoSection
                  isStreaming={isStreaming}
                  size={resolvedSizeForVideo}
                  effectSettings={safeEffectSettings as any}
                  cameraDeviceId={safeDeviceSettings.selectedCamera}
                  mirror={safeEffectSettings.mirror ?? safeDeviceSettings.mirror}
                />

                {/* Live Indicator */}
                {isStreaming && (
                  <div className="live-indicator">
                    <span className="live-dot"></span>
                    LIVE
                  </div>
                )}

                {/* Stream Stats Overlay */}
                <div className="stream-info-overlay">
                  <div className="stream-stats">
                    <span>??? {combinedStats.viewers}</span>
                    <span>?? {combinedStats.likes}</span>
                    <span>?? {combinedStats.gifts}</span>
                    {isRaidMode && <span>?? RAID</span>}
                    {!!slowModeDelay && <span>?? {slowModeDelay}s</span>}
                  </div>
                </div>

                {/* Integrated Floating Chat - TikTok Style */}
                {showChat && (
                  <div
                    className="floating-chat-overlay"
                    style={{ opacity: chatOpacity / 100 }}
                  >
                    <div
                      className="floating-chat-messages"
                      ref={chatContainerRef}
                    >
                      {chatMessages.slice(-8).map((msg) => (
                        <div
                          key={msg.id}
                          className={`floating-chat-message ${msg.type || "normal"}`}
                          style={{
                            opacity: chatOpacity === 0 ? 0 : 1,
                            transition: "opacity 0.3s ease",
                          }}
                        >
                          <span className="floating-chat-user">
                            {msg.user}:
                          </span>
                          <span className="floating-chat-text">
                            {msg.message}
                            {msg.type === "gift" && msg.giftAmount && (
                              <span style={{ marginLeft: "8px" }}>
                                ?? x{msg.giftAmount}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Input */}
                {showChat && (
                  <div
                    className="floating-chat-input-wrapper"
                    style={{
                      opacity: chatOpacity / 100,
                      pointerEvents: chatOpacity < 20 ? "none" : "auto",
                    }}
                  >
                    <input
                      ref={chatInputRef}
                      type="text"
                      className="floating-chat-input"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      maxLength={200}
                    />
                    <button
                      className="floating-chat-send"
                      onClick={handleChatSend}
                      title="Send message"
                    />
                  </div>
                )}

                {/* Viewer Reactions */}
                <div className="viewer-reactions">
                  {reactions.map((reaction) => (
                    <div
                      key={reaction.id}
                      className="reaction"
                      style={{
                        left: `${Math.random() * 60 - 30}px`,
                        animationDelay: `${Math.random() * 0.5}s`,
                      }}
                    >
                      {reaction.emoji}
                    </div>
                  ))}
                </div>
              </div>

              {/* Giveaway Button */}
              {queue.some((q: unknown) => q.type === "giveaway") && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "20px",
                    right: "120px",
                    zIndex: 103,
                  }}
                >
                  <Button
                    className="draw-winner-btn"
                    onClick={handleDrawWinner}
                  >
                    ?? DRAW WINNER (
                    {queue.filter((q: unknown) => q.type === "giveaway").length})
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Moderation Section */}
          <section className="moderation-section moderation-center section-card">
            <ModerationSection />
          </section>

          {/* Bottom Panels */}
          <section className="panel-grid-bottom">
            <div className="section-card">
              <PollPanel />
            </div>

            <div className="section-card">
              <StatsBar stats={combinedStats as any} />
            </div>
          </section>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default EpicLivestream;
