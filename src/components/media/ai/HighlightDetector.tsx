import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Activity, Mic, MessageSquare, TrendingUp, Zap } from 'lucide-react';

interface HighlightDetectorProps {
  waveform?: Float32Array;
  chatData?: ChatMessage[];
  /** Aktuelle Abspielzeit (Sekunden oder Millisekunden – wird automatisch normalisiert) */
  currentTime: number;
  onHighlightDetected: (highlight: DetectedHighlight) => void;

  sensitivity?: number;            // 0–1 (Basis für Audio)
  detectionInterval?: number;      // ms
  enableAudioDetection?: boolean;
  enableChatDetection?: boolean;
  enableMotionDetection?: boolean; // Platzhalter – Score-Fusion unterstützt es bereits
  threshold?: HighlightThreshold;  // feingranulare Schwellen

  /** Minimale Zeit zwischen zwei Detections gleicher Art (ms) */
  cooldownMs?: number;

  /** Position des Indicators */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  /** Sek. oder ms – wird normalisiert */
  timestamp: number;
  emotes?: string[];
}

export interface DetectedHighlight {
  /** Sekunden */
  timestamp: number;
  duration: number;
  /** 0–100 */
  score: number;
  /** 0–1 */
  confidence: number;
  type: 'audio-peak' | 'chat-burst' | 'motion-spike' | 'combined';
  reason: string;
  metrics: HighlightMetrics;
}

interface HighlightMetrics {
  audioLevel?: number;
  audioPeakCount?: number;
  chatVelocity?: number;
  chatEmoteRatio?: number;
  motionIntensity?: number;
  combinedScore?: number; // 0–1
}

interface HighlightThreshold {
  audioPeak: number;   // 0–1
  chatBurst: number;   // 0–1
  motionSpike: number; // 0–1
  combined: number;    // 0–1
}

/* ------------------------ Heuristischer Analyzer ------------------------ */

class HeuristicAnalyzer {
  private detectionHistory: DetectedHighlight[] = [];
  private readonly maxHistorySize = 100;

  analyzeAudioPeaks(waveform: Float32Array, sensitivity: number = 0.7): AudioAnalysis {
    const windowSize = 2205; // ~50 ms bei 44.1 kHz
    const hop = Math.floor(windowSize / 2);
    const peaks: Peak[] = [];
    let maxAmplitude = 0;
    let avgAccumulator = 0;
    let windows = 0;

    for (let i = 0; i + windowSize <= waveform.length; i += hop) {
      const slice = waveform.subarray(i, i + windowSize);
      const amplitude = this.calculateRMS(slice);
      avgAccumulator += amplitude;
      windows++;
      if (amplitude > maxAmplitude) maxAmplitude = amplitude;

      // dynamische Schwelle basierend auf bisheriger Durchschnittsenergie
      const runningAvg = avgAccumulator / windows;
      const threshold = runningAvg * (2 - sensitivity);
      if (amplitude > threshold) {
        peaks.push({
          timestamp: i / 44100, // s
          amplitude,
          frequency: this.estimateFrequency(slice),
        });
      }
    }

    const avgAmplitude = windows ? avgAccumulator / windows : 0;
    const durationSec = waveform.length / 44100;
    const peakDensity = durationSec > 0 ? peaks.length / durationSec : 0;
    const dynamicRange = Math.max(0, maxAmplitude - avgAmplitude);
    const score = this.calculateAudioScore(peaks, dynamicRange, peakDensity);

    return {
      peaks,
      avgAmplitude,
      maxAmplitude,
      dynamicRange,
      peakDensity,
      score,
      isHighlight: score > sensitivity,
    };
  }

  analyzeChatBurst(messages: ChatMessage[], timeWindowMs: number = 5000): ChatAnalysis {
    const nowMs = Date.now();
    const norm = (t: number) => (t > 1e12 ? t : t * 1000); // ms-Normalisierung

    const recent = messages.filter((m) => nowMs - norm(m.timestamp) < timeWindowMs);
    const secs = timeWindowMs / 1000;
    const velocity = secs > 0 ? recent.length / secs : 0;

    const emoteCount = recent.reduce((sum, m) => sum + (m.emotes?.length || 0), 0);
    const emoteRatio = recent.length > 0 ? emoteCount / recent.length : 0;

    const patterns = this.detectChatPatterns(recent);
    const sentiment = this.analyzeSentiment(recent);

    const score = this.calculateChatScore(velocity, emoteRatio, patterns, sentiment);

    return {
      messageCount: recent.length,
      velocity,
      emoteRatio,
      patterns,
      sentiment,
      score,
      isHighlight: score > 0.7,
    };
  }

  detectCombinedHighlights(
    audio: AudioAnalysis,
    chat: ChatAnalysis,
    motion?: MotionAnalysis
  ): DetectedHighlight | null {
    const weights = { audio: 0.4, chat: 0.3, motion: 0.3 };
    const combinedScore =
      audio.score * weights.audio + chat.score * weights.chat + (motion?.score || 0) * weights.motion;

    const confidence = this.calculateConfidence(audio, chat, motion);

    if (combinedScore > 0.75) {
      return {
        timestamp: Date.now() / 1000, // s
        duration: this.estimateDuration(audio, chat),
        score: combinedScore * 100,
        confidence,
        type: this.determineType(audio, chat, motion),
        reason: this.generateReason(audio, chat, motion),
        metrics: {
          audioLevel: audio.avgAmplitude,
          audioPeakCount: audio.peaks.length,
          chatVelocity: chat.velocity,
          chatEmoteRatio: chat.emoteRatio,
          motionIntensity: motion?.intensity,
          combinedScore,
        },
      };
    }
    return null;
  }

  addToHistory(h: DetectedHighlight) {
    this.detectionHistory.push(h);
    if (this.detectionHistory.length > this.maxHistorySize) this.detectionHistory.shift();
  }

  getRecentHighlights(windowMs = 60000): DetectedHighlight[] {
    const cutoffSec = Date.now() / 1000 - windowMs / 1000;
    return this.detectionHistory.filter((h) => h.timestamp > cutoffSec);
  }

  /* ------------------------- interne Helfer ------------------------- */

  private calculateRMS(buf: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    return Math.sqrt(sum / (buf.length || 1));
  }

  private estimateFrequency(buf: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < buf.length; i++) {
      const prevPos = buf[i - 1] >= 0;
      const curPos = buf[i] >= 0;
      if (prevPos !== curPos) crossings++;
    }
    return (crossings / (buf.length || 1)) * 22050;
  }

  private calculateAudioScore(peaks: Peak[], dynamicRange: number, peakDensity: number): number {
    const peakScore = Math.min(1, peakDensity / 10);
    const dynamicScore = Math.min(1, dynamicRange * 2);
    const consistencyScore = this.calculatePeakConsistency(peaks);
    return peakScore * 0.4 + dynamicScore * 0.3 + consistencyScore * 0.3;
  }

  private calculatePeakConsistency(peaks: Peak[]): number {
    if (peaks.length < 2) return 0;
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) intervals.push(peaks[i].timestamp - peaks[i - 1].timestamp);
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / intervals.length;
    return avg > 0 ? Math.max(0, 1 - variance / avg) : 0;
  }

  private detectChatPatterns(messages: ChatMessage[]): ChatPattern[] {
    const patterns: ChatPattern[] = [];

    // Spam/Chant
    const map = new Map<string, number>();
    messages.forEach((m) => {
      const k = m.message.toLowerCase().trim();
      map.set(k, (map.get(k) || 0) + 1);
    });
    map.forEach((count, msg) => {
      if (count >= 3) {
        patterns.push({ type: 'spam', value: msg, count, score: count / messages.length });
      }
    });

    // Emote-Ketten
    const emoteChains = messages.filter((m) => (m.emotes?.length || 0) > 2);
    if (emoteChains.length) {
      patterns.push({
        type: 'emote-chain',
        value: 'emotes',
        count: emoteChains.length,
        score: emoteChains.length / (messages.length || 1),
      });
    }

    // Hype-Keywords
    const hype = ['pog', 'wow', 'omg', 'hype', 'lets go', 'gg', 'ez'];
    const hypeMsgs = messages.filter((m) => hype.some((k) => m.message.toLowerCase().includes(k)));
    if (hypeMsgs.length) {
      patterns.push({
        type: 'hype',
        value: 'excitement',
        count: hypeMsgs.length,
        score: hypeMsgs.length / (messages.length || 1),
      });
    }

    return patterns;
  }

  private analyzeSentiment(messages: ChatMessage[]): number {
    const pos = ['good', 'great', 'awesome', 'love', 'best', 'amazing', 'nice'];
    const neg = ['bad', 'hate', 'worst', 'terrible', 'awful', 'boring'];
    let s = 0;
    messages.forEach((m) => {
      const lower = m.message.toLowerCase();
      pos.forEach((w) => lower.includes(w) && (s += 0.1));
      neg.forEach((w) => lower.includes(w) && (s -= 0.1));
    });
    return Math.max(-1, Math.min(1, s));
  }

  private calculateChatScore(velocity: number, emoteRatio: number, patterns: ChatPattern[], sentiment: number): number {
    const velocityScore = Math.min(1, velocity / 10);
    const emoteScore = Math.min(1, emoteRatio * 2);
    const patternScore = (patterns.reduce((sum, p) => sum + p.score, 0) / Math.max(1, patterns.length)) || 0;
    const sentimentScore = (sentiment + 1) / 2;
    return velocityScore * 0.3 + emoteScore * 0.2 + patternScore * 0.3 + sentimentScore * 0.2;
  }

  private calculateConfidence(audio: AudioAnalysis, chat: ChatAnalysis, motion?: MotionAnalysis): number {
    let conf = 0;
    let factors = 0;
    if (audio.isHighlight) { conf += audio.score; factors++; }
    if (chat.isHighlight) { conf += chat.score; factors++; }
    if (motion?.isHighlight) { conf += motion.score; factors++; }
    return factors ? conf / factors : 0;
  }

  private estimateDuration(audio: AudioAnalysis, chat: ChatAnalysis): number {
    if (audio.peaks.length >= 2) {
      const first = audio.peaks[0].timestamp;
      const last = audio.peaks[audio.peaks.length - 1].timestamp;
      return Math.max(1, last - first + 2);
    }
    return Math.max(1, Math.min(10, chat.velocity)); // 1–10 s
  }

  private determineType(audio: AudioAnalysis, chat: ChatAnalysis, motion?: MotionAnalysis): DetectedHighlight['type'] {
    const scores = { audio: audio.score, chat: chat.score, motion: motion?.score || 0 };
    const max = Math.max(scores.audio, scores.chat, scores.motion);
    if (scores.audio === max && audio.isHighlight) return 'audio-peak';
    if (scores.chat === max && chat.isHighlight) return 'chat-burst';
    if (scores.motion === max && motion?.isHighlight) return 'motion-spike';
    return 'combined';
  }

  private generateReason(audio: AudioAnalysis, chat: ChatAnalysis, motion?: MotionAnalysis): string {
    const r: string[] = [];
    if (audio.isHighlight) r.push(`Audio peak (${audio.peaks.length} peaks)`);
    if (chat.isHighlight) r.push(`Chat burst (${chat.velocity.toFixed(1)} msg/s)`);
    if (motion?.isHighlight) r.push('High motion');
    return r.join(', ') || 'Multiple factors indicate a highlight';
  }
}

/* ------------------------------ Typen ------------------------------ */

interface Peak {
  timestamp: number;   // s
  amplitude: number;
  frequency: number;
}

interface AudioAnalysis {
  peaks: Peak[];
  avgAmplitude: number;
  maxAmplitude: number;
  dynamicRange: number;
  peakDensity: number;
  /** 0–1 */
  score: number;
  isHighlight: boolean;
}

interface ChatAnalysis {
  messageCount: number;
  velocity: number;     // msg/s
  emoteRatio: number;   // 0–1
  patterns: ChatPattern[];
  sentiment: number;    // -1..1
  score: number;        // 0–1
  isHighlight: boolean;
}

interface ChatPattern {
  type: 'spam' | 'emote-chain' | 'hype';
  value: string;
  count: number;
  score: number; // 0–1
}

interface MotionAnalysis {
  intensity: number; // 0–1
  score: number;     // 0–1
  isHighlight: boolean;
}

/* ----------------------------- Component ----------------------------- */

const HighlightDetector: React.FC<HighlightDetectorProps> = ({
  waveform,
  chatData = [],
  currentTime,
  onHighlightDetected,
  sensitivity = 0.7,
  detectionInterval = 1000,
  enableAudioDetection = true,
  enableChatDetection = true,
  enableMotionDetection = false, // noch nicht ausgewertet – Hook/Prop vorgesehen
  threshold = { audioPeak: 0.7, chatBurst: 0.6, motionSpike: 0.8, combined: 0.75 },
  cooldownMs = 1200,
  position = 'bottom-right',
}) => {
  const prefersReducedMotion = useReducedMotion();

  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetection, setLastDetection] = useState<DetectedHighlight | null>(null);
  const [stats, setStats] = useState({ audio: 0, chat: 0, combined: 0 });
  const [showIndicator, setShowIndicator] = useState(false);

  const analyzer = useRef(new HeuristicAnalyzer());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFiredRef = useRef<Record<DetectedHighlight['type'], number>>({
    'audio-peak': 0, 'chat-burst': 0, 'motion-spike': 0, 'combined': 0,
  });

  // Refs für aktuelle Daten (um Interval-Neustarts zu vermeiden)
  const waveformRef = useRef<Float32Array | undefined>(waveform);
  const chatRef = useRef<ChatMessage[]>(chatData);
  const timeRef = useRef<number>(currentTime);

  useEffect(() => { waveformRef.current = waveform; }, [waveform]);
  useEffect(() => { chatRef.current = chatData; }, [chatData]);
  useEffect(() => { timeRef.current = currentTime; }, [currentTime]);

  const normSeconds = (t: number) => (t > 1e12 ? t / 1000 : t);

  const handleHighlightDetection = useCallback((h: DetectedHighlight) => {
    // Cooldown pro Typ
    const now = performance.now();
    const last = lastFiredRef.current[h.type] || 0;
    if (now - last < cooldownMs) return;
    lastFiredRef.current[h.type] = now;

    setLastDetection(h);
    analyzer.current.addToHistory(h);
    onHighlightDetected(h);

    setShowIndicator(true);
    const to = setTimeout(() => setShowIndicator(false), 2000);
    return () => clearTimeout(to);
  }, [onHighlightDetected, cooldownMs]);

  // Detection-Loop
  useEffect(() => {
    const detect = () => {
      setIsDetecting(true);

      const wf = waveformRef.current;
      const chat = chatRef.current;

      let audioAnalysis: AudioAnalysis | null = null;
      let chatAnalysis: ChatAnalysis | null = null;

      // Audio
      if (enableAudioDetection && wf && wf.length) {
        audioAnalysis = analyzer.current.analyzeAudioPeaks(wf, sensitivity);
        if (audioAnalysis.isHighlight && audioAnalysis.score > threshold.audioPeak) {
          const hl: DetectedHighlight = {
            timestamp: normSeconds(timeRef.current),
            duration: 2,
            score: audioAnalysis.score * 100,
            confidence: audioAnalysis.score,
            type: 'audio-peak',
            reason: `Audio peak: ${audioAnalysis.peaks.length} peaks, DR=${audioAnalysis.dynamicRange.toFixed(2)}`,
            metrics: {
              audioLevel: audioAnalysis.avgAmplitude,
              audioPeakCount: audioAnalysis.peaks.length,
            },
          };
          handleHighlightDetection(hl);
          setStats((s) => ({ ...s, audio: s.audio + 1 }));
        }
      }

      // Chat
      if (enableChatDetection && chat && chat.length) {
        chatAnalysis = analyzer.current.analyzeChatBurst(chat);
        if (chatAnalysis.isHighlight && chatAnalysis.score > threshold.chatBurst) {
          const hl: DetectedHighlight = {
            timestamp: normSeconds(timeRef.current),
            duration: 3,
            score: chatAnalysis.score * 100,
            confidence: chatAnalysis.score,
            type: 'chat-burst',
            reason: `Chat burst: ${chatAnalysis.velocity.toFixed(1)} msg/s, ${(chatAnalysis.emoteRatio * 100).toFixed(0)}% emotes`,
            metrics: {
              chatVelocity: chatAnalysis.velocity,
              chatEmoteRatio: chatAnalysis.emoteRatio,
            },
          };
          handleHighlightDetection(hl);
          setStats((s) => ({ ...s, chat: s.chat + 1 }));
        }
      }

      // Kombiniert
      if (audioAnalysis && chatAnalysis) {
        const combined = analyzer.current.detectCombinedHighlights(audioAnalysis, chatAnalysis);
        if (combined && combined.score > threshold.combined * 100) {
          // timestamp auf Stream-Zeit normieren
          combined.timestamp = normSeconds(timeRef.current);
          handleHighlightDetection(combined);
          setStats((s) => ({ ...s, combined: s.combined + 1 }));
        }
      }

      setIsDetecting(false);
    };

    // Intervall starten (nur bei Konfig-Änderungen neu)
    timerRef.current = setInterval(detect, detectionInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    detectionInterval,
    enableAudioDetection,
    enableChatDetection,
    enableMotionDetection, // reserviert
    sensitivity,
    threshold.audioPeak,
    threshold.chatBurst,
    threshold.combined,
    handleHighlightDetection,
  ]);

  const recentHighlights = useMemo(
    () => analyzer.current.getRecentHighlights(30000),
    [lastDetection] // update wenn etwas Neues reinkommt
  );

  // Positionierung
  const posStyle: React.CSSProperties = useMemo(() => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
      pointerEvents: 'none',
    };
    const pad = 20;
    switch (position) {
      case 'bottom-left': return { ...base, bottom: pad, left: pad };
      case 'top-right':   return { ...base, top: pad, right: pad };
      case 'top-left':    return { ...base, top: pad, left: pad };
      default:            return { ...base, bottom: pad, right: pad };
    }
  }, [position]);

  return (
    <div style={posStyle} aria-live="polite" aria-atomic="true">
      {/* Indicator */}
      <AnimatePresence>
        {showIndicator && lastDetection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: prefersReducedMotion ? 0 : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: prefersReducedMotion ? 0 : -20 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.9) 0%, rgba(138, 43, 226, 0.9) 100%)',
              borderRadius: 12,
              boxShadow: '0 10px 40px rgba(0, 255, 204, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              pointerEvents: 'auto',
              cursor: 'default',
            }}
            role="status"
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: prefersReducedMotion ? undefined : 'pulse 1s ease-in-out infinite',
              }}
              aria-hidden
            >
              {lastDetection.type === 'audio-peak' && <Activity size={20} color="white" />}
              {lastDetection.type === 'chat-burst' && <MessageSquare size={20} color="white" />}
              {lastDetection.type === 'motion-spike' && <Zap size={20} color="white" />}
              {lastDetection.type === 'combined' && <TrendingUp size={20} color="white" />}
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4 }}>
                Highlight detected
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.95)' }}>
                {lastDetection.reason}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                Score: {Math.round(lastDetection.score)}% • Confidence: {Math.round(lastDetection.confidence * 100)}%
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini-Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        style={{
          position: 'absolute',
          bottom: -60,
          right: 0,
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 8,
          fontSize: 10,
          color: 'rgba(255, 255, 255, 0.6)',
          display: 'flex',
          gap: 12,
          pointerEvents: 'none',
        }}
        aria-hidden
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Mic size={10} /> {stats.audio}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <MessageSquare size={10} /> {stats.chat}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TrendingUp size={10} /> {stats.combined}
        </div>
      </motion.div>

      {/* Detecting-Status */}
      {isDetecting && (
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: 0,
            padding: '4px 8px',
            background: 'rgba(138, 43, 226, 0.2)',
            borderRadius: 4,
            fontSize: 10,
            color: '#8a2be2',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          aria-hidden
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#8a2be2',
              animation: prefersReducedMotion ? undefined : 'blink 1s ease-in-out infinite',
            }}
          />
          Detecting…
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.85; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default HighlightDetector;
