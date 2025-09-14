import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Layers, Zap, TrendingUp, BarChart3, Play, Pause, Settings, Cpu,
} from 'lucide-react';

import SuggestionCard from './SuggestionCard';
import HighlightDetector from './HighlightDetector';
import AutoClipper from './AutoClipper';

/* ===========================
   Types
   =========================== */

interface AIAssistantProps {
  mediaId: string;
  duration: number;
  currentTime: number;
  waveform?: Float32Array;
  chatData?: ChatMessage[];
  videoFrames?: VideoFrame[];
  onSuggestionApply: (suggestion: AISuggestion) => void;
  onFeedback: (suggestionId: string, feedback: FeedbackData) => void;
  onAutoClip: (clips: AutoClip[]) => void;
  userId?: string;
  projectId?: string;
  apiKey?: string;
  modelVersion?: 'basic' | 'advanced' | 'quantum';
}

export interface AISuggestion {
  id: string;
  type: SuggestionType;
  score: number;
  confidence: number;
  timestamp: number;
  duration: number;
  title: string;
  description: string;
  reason: string;
  thumbnail?: string;
  metadata: SuggestionMetadata;
  priority: Priority;
  tags: string[];
  relatedSuggestions?: string[];
  applied: boolean;
  feedback?: FeedbackData;
  version: number;
  created: Date;
  neuralSignature?: NeuralSignature;
}

type SuggestionType =
  | 'highlight'
  | 'emotional-peak'
  | 'action-sequence'
  | 'dialogue-important'
  | 'music-sync'
  | 'chat-reaction'
  | 'scene-change'
  | 'color-shift'
  | 'motion-peak'
  | 'silence-break'
  | 'laughter'
  | 'applause'
  | 'climax'
  | 'intro-worthy'
  | 'outro-worthy'
  | 'viral-potential'
  | 'meme-worthy'
  | 'tutorial-step'
  | 'key-moment'
  | 'transition-point';

interface SuggestionMetadata {
  audioLevel?: number;
  motionScore?: number;
  emotionScores?: EmotionScores;
  chatActivity?: number;
  viewerEngagement?: number;
  technicalQuality?: TechnicalQuality;
  contextualRelevance?: number;
  semanticAnalysis?: SemanticData;
  visualComplexity?: number;
  audioComplexity?: number;
}

interface EmotionScores {
  joy: number;
  excitement: number;
  surprise: number;
  sadness: number;
  anger: number;
  fear: number;
  disgust: number;
  neutral: number;
}

interface TechnicalQuality {
  sharpness: number;
  brightness: number;
  contrast: number;
  saturation: number;
  stability: number;
  audioClarity: number;
}

interface SemanticData {
  keywords: string[];
  topics: string[];
  sentiment: number;
  entities: Entity[];
}

interface Entity {
  type: string;
  value: string;
  confidence: number;
}

interface FeedbackData {
  rating: 'positive' | 'negative' | 'neutral';
  useful: boolean;
  accurate: boolean;
  applied: boolean;
  comment?: string;
  adjustments?: unknown;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  emotes?: string[];
  badges?: string[];
}

interface VideoFrame {
  timestamp: number;
  data: ImageData;
  motion?: number;
  brightness?: number;
}

export interface AutoClip {
  id: string;
  sourceId: string;
  startTime: number;
  endTime: number;
  suggestion: AISuggestion;
  title: string;
  tags: string[];
  exportSettings?: ExportSettings;
  version: number;
  created: Date;
}

interface ExportSettings {
  format: string;
  resolution: string;
  fps: number;
  bitrate: number;
}

type Priority = 'critical' | 'high' | 'medium' | 'low';

interface NeuralSignature {
  pattern: number[];
  cluster: string;
  embedding: Float32Array;
}

/* ===========================
   Quantum AI Engine (stubs)
   =========================== */

class QuantumAIEngine {
  private neuralLayers: NeuralLayer[] = [];
  private quantumState: QuantumState;
  private modelWeights: Float32Array;
  private attentionMatrix: Float32Array;
  private transformerHeads: number = 8;

  constructor(modelVersion: 'basic' | 'advanced' | 'quantum' = 'advanced') {
    this.initializeNeuralNetwork(modelVersion);
    this.quantumState = new QuantumState();
    this.modelWeights = new Float32Array(1048576);
    this.attentionMatrix = new Float32Array(65536);
    this.loadPretrainedWeights();
  }

  private initializeNeuralNetwork(version: string) {
    const configs = {
      basic: { layers: 6, neurons: 128, heads: 4 },
      advanced: { layers: 12, neurons: 512, heads: 8 },
      quantum: { layers: 24, neurons: 2048, heads: 16 },
    };
    const config = (configs as any)[version] || configs.advanced;

    for (let i = 0; i < config.layers; i++) {
      this.neuralLayers.push({
        type: (i % 3 === 0 ? 'attention' : i % 3 === 1 ? 'feed-forward' : 'normalization') as NeuralLayer['type'],
        neurons: config.neurons,
        activation: 'gelu',
        dropout: 0.1,
        weights: new Float32Array(config.neurons * config.neurons),
      });
    }
  }

  private loadPretrainedWeights() {
    for (let i = 0; i < this.modelWeights.length; i++) {
      this.modelWeights[i] = (Math.random() - 0.5) * Math.sqrt(2 / this.modelWeights.length);
    }
  }

  analyzeContent(
    frames: VideoFrame[],
    audio: Float32Array,
    chat: ChatMessage[],
    context: AnalysisContext
  ): AISuggestion[] {
    const visual = this.extractVisualFeatures(frames);
    const aud = this.extractAudioFeatures(audio);
    const ch = this.extractChatFeatures(chat);
    const cx = this.extractContextFeatures(context);

    const fused = this.multiModalAttention(visual, aud, ch, cx);

    let hidden = fused;
    for (const layer of this.neuralLayers) {
      hidden = this.processLayer(hidden, layer);
    }

    const suggestions = this.decodeSuggestions(hidden);
    return this.quantumOptimize(suggestions);
  }

  private extractVisualFeatures(frames: VideoFrame[]): Float32Array {
    const f = new Float32Array(512);
    frames.forEach((frame, i) => {
      const motionWeight = frame.motion || 0;
      const brightnessWeight = frame.brightness || 0.5;
      f[i % 512] += motionWeight * 0.3 + brightnessWeight * 0.2;
      f[(i + 256) % 512] += this.detectEdges(frame.data) * 0.5;
    });
    return this.normalize(f);
  }

  private extractAudioFeatures(audio: Float32Array): Float32Array {
    const f = new Float32Array(512);
    const fft = this.performFFT(audio);
    for (let i = 0; i < 512; i++) f[i] = fft[i] || 0;
    this.detectBeats(audio).forEach((beat, i) => {
      f[i % 512] += beat.strength * 0.5;
    });
    return this.normalize(f);
  }

  private extractChatFeatures(chat: ChatMessage[]): Float32Array {
    const f = new Float32Array(512);
    const velocity = this.calculateChatVelocity(chat);
    const sentiment = this.analyzeChatSentiment(chat);
    const emoteScore = this.calculateEmoteScore(chat);
    f[0] = velocity;
    f[1] = sentiment;
    f[2] = emoteScore;
    for (let i = 0; i < chat.length && i < 509; i++) {
      f[i + 3] = chat[i].message.length / 100;
    }
    return this.normalize(f);
  }

  private extractContextFeatures(context: AnalysisContext): Float32Array {
    const f = new Float32Array(512);
    f[0] = context.timeOfDay / 24;
    f[1] = context.dayOfWeek / 7;
    f[2] = context.contentType === 'gaming' ? 1 : context.contentType === 'tutorial' ? 0.5 : 0;
    f[3] = context.audienceSize / 10000;
    f[4] = context.engagementRate;
    return this.normalize(f);
  }

  private multiModalAttention(visual: Float32Array, audio: Float32Array, chat: Float32Array, context: Float32Array) {
    const combined = new Float32Array(2048);
    combined.set(visual, 0);
    combined.set(audio, 512);
    combined.set(chat, 1024);
    combined.set(context, 1536);

    const attended = new Float32Array(2048);
    const headSize = 2048 / this.transformerHeads;

    for (let h = 0; h < this.transformerHeads; h++) {
      const start = Math.floor(h * headSize);
      const end = Math.floor(start + headSize);
      for (let i = start; i < end; i++) {
        let sum = 0;
        for (let j = 0; j < 2048; j++) {
          const attention = this.calculateAttention(i, j);
          sum += combined[j] * attention;
        }
        attended[i] = sum;
      }
    }
    return attended;
  }

  private calculateAttention(i: number, j: number): number {
    const similarity = Math.exp(-Math.abs(i - j) / 100);
    return similarity / (1 + similarity);
  }

  private processLayer(input: Float32Array, layer: NeuralLayer): Float32Array {
    switch (layer.type) {
      case 'attention':
        return this.selfAttention(input, layer);
      case 'feed-forward':
        return this.feedForward(input, layer);
      case 'normalization':
        return this.layerNorm(input);
      default:
        return input;
    }
  }

  private selfAttention(input: Float32Array, layer: NeuralLayer): Float32Array {
    const out = new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      let sum = 0;
      for (let j = 0; j < input.length; j++) {
        const w = layer.weights[(i * input.length + j) % layer.weights.length];
        sum += input[j] * w;
      }
      out[i] = this.activation(sum, layer.activation);
    }
    return out;
  }

  private feedForward(input: Float32Array, layer: NeuralLayer): Float32Array {
    const hidden = new Float32Array(layer.neurons);
    const out = new Float32Array(input.length);

    for (let i = 0; i < layer.neurons; i++) {
      let sum = 0;
      for (let j = 0; j < input.length; j++) {
        const w = layer.weights[(i * input.length + j) % layer.weights.length];
        sum += input[j] * w;
      }
      hidden[i] = this.activation(sum, layer.activation);
    }

    for (let i = 0; i < out.length; i++) {
      let sum = 0;
      for (let j = 0; j < hidden.length; j++) {
        const w = layer.weights[(i * hidden.length + j) % layer.weights.length];
        sum += hidden[j] * w;
      }
      out[i] = sum + input[i]; // residual
    }

    return out;
  }

  private layerNorm(input: Float32Array): Float32Array {
    const mean = input.reduce((a, b) => a + b, 0) / input.length;
    const variance = input.reduce((a, b) => a + (b - mean) ** 2, 0) / input.length;
    const std = Math.sqrt(variance + 1e-5);
    const out = new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) out[i] = (input[i] - mean) / std;
    return out;
  }

  private activation(x: number, type: string): number {
    switch (type) {
      case 'relu':
        return Math.max(0, x);
      case 'gelu':
        return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
      case 'sigmoid':
        return 1 / (1 + Math.exp(-x));
      case 'tanh':
        return Math.tanh(x);
      default:
        return x;
    }
  }

  private decodeSuggestions(features: Float32Array): AISuggestion[] {
    const out: AISuggestion[] = [];
    const threshold = 0.7;

    for (let i = 0; i < features.length; i += 64) {
      const slice = features.slice(i, i + 64);
      const score = this.calculateScore(slice);
      if (score > threshold) out.push(this.createSuggestion(slice, score));
    }
    return out;
  }

  private calculateScore(features: Float32Array): number {
    return features.reduce((a, b) => a + Math.abs(b), 0) / features.length;
  }

  private createSuggestion(features: Float32Array, score: number): AISuggestion {
    const type = this.inferSuggestionType(features);
    const timestamp = this.inferTimestamp(features);
    return {
      id: `ai-suggestion-${Date.now()}-${Math.random()}`,
      type,
      score: score * 100,
      confidence: this.calculateConfidence(features),
      timestamp,
      duration: this.inferDuration(features),
      title: this.generateTitle(type, score),
      description: this.generateDescription(type, features),
      reason: this.generateReason(type, features),
      metadata: this.extractMetadata(features),
      priority: this.calculatePriority(score),
      tags: this.generateTags(type, features),
      applied: false,
      version: 1,
      created: new Date(),
      neuralSignature: {
        pattern: Array.from(features.slice(0, 16)),
        cluster: this.identifyCluster(features),
        embedding: features,
      },
    };
  }

  private inferSuggestionType(features: Float32Array): SuggestionType {
    const types: SuggestionType[] = [
      'highlight',
      'emotional-peak',
      'action-sequence',
      'dialogue-important',
      'music-sync',
      'chat-reaction',
      'scene-change',
      'viral-potential',
    ];
    const index = Math.floor(Math.abs(features[0]) * types.length);
    return types[index] || 'highlight';
  }

  private inferTimestamp(features: Float32Array): number {
    return Math.abs(features[1]) * 100;
  }

  private inferDuration(features: Float32Array): number {
    return Math.max(1, Math.abs(features[2]) * 10);
  }

  private calculateConfidence(features: Float32Array): number {
    const variance = this.calculateVariance(features);
    return Math.max(0, Math.min(1, 1 - variance));
  }

  private calculateVariance(arr: Float32Array): number {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  }

  private generateTitle(type: SuggestionType, _score: number): string {
    const titles: Partial<Record<SuggestionType, string>> = {
      'highlight': 'Key Highlight Detected',
      'emotional-peak': 'Emotional Moment',
      'action-sequence': 'Action Sequence',
      'dialogue-important': 'Important Dialogue',
      'music-sync': 'Perfect Music Sync',
      'chat-reaction': 'Chat Explosion',
      'scene-change': 'Scene Transition',
      'viral-potential': 'ðŸ”¥ Viral Potential',
    };
    return titles[type] || 'AI Highlight';
  }

  private generateDescription(type: SuggestionType, features: Float32Array): string {
    const intensity = Math.abs(features[3]);
    const desc: Partial<Record<SuggestionType, string>> = {
      'highlight': `High-energy moment with ${Math.round(intensity * 100)}% intensity`,
      'emotional-peak': 'Strong emotional response detected',
      'action-sequence': 'Fast-paced action sequence identified',
      'dialogue-important': 'Key dialogue that drives the narrative',
      'music-sync': 'Perfect synchronization with background music',
      'chat-reaction': 'Massive chat engagement spike',
      'scene-change': 'Natural transition point between scenes',
      'viral-potential': 'This moment has viral characteristics',
    };
    return desc[type] || 'AI-detected important moment';
  }

  private generateReason(_type: SuggestionType, features: Float32Array): string {
    return `Neural confidence: ${Math.round(this.calculateConfidence(features) * 100)}%`;
  }

  private extractMetadata(features: Float32Array): SuggestionMetadata {
    return {
      audioLevel: Math.abs(features[4]),
      motionScore: Math.abs(features[5]),
      chatActivity: Math.abs(features[6]),
      viewerEngagement: Math.abs(features[7]),
      visualComplexity: Math.abs(features[8]),
      audioComplexity: Math.abs(features[9]),
    };
  }

  private calculatePriority(score: number): Priority {
    if (score > 0.9) return 'critical';
    if (score > 0.7) return 'high';
    if (score > 0.5) return 'medium';
    return 'low';
  }

  private generateTags(type: SuggestionType, features: Float32Array): string[] {
    const tags = [type];
    if (features[10] > 0.5) tags.push('high-energy');
    if (features[11] > 0.5) tags.push('emotional');
    if (features[12] > 0.5) tags.push('viral');
    if (features[13] > 0.5) tags.push('shareable');
    return tags;
  }

  private identifyCluster(features: Float32Array): string {
    const sum = features.reduce((a, b) => a + b, 0);
    if (sum > 10) return 'high-activity';
    if (sum > 5) return 'medium-activity';
    return 'low-activity';
  }

  private quantumOptimize(suggestions: AISuggestion[]): AISuggestion[] {
    return suggestions.sort(
      (a, b) =>
        this.quantumState.calculateQuantumScore(b) - this.quantumState.calculateQuantumScore(a)
    );
  }

  private normalize(arr: Float32Array): Float32Array {
    const nums = Array.from(arr);
    const max = nums.length ? Math.max(...nums) : 1;
    const min = nums.length ? Math.min(...nums) : 0;
    const range = max - min || 1;
    const out = new Float32Array(arr.length);
    for (let i = 0; i < arr.length; i++) out[i] = (arr[i] - min) / range;
    return out;
  }

  private performFFT(audio: Float32Array): Float32Array {
    const fft = new Float32Array(512);
    for (let i = 0; i < 512; i++) fft[i] = audio[i] || 0;
    return fft;
  }

  private detectBeats(audio: Float32Array): Beat[] {
    const beats: Beat[] = [];
    const threshold = 0.5;
    for (let i = 0; i < audio.length; i += 1024) {
      const chunk = audio.slice(i, i + 1024);
      const energy = chunk.reduce((a, b) => a + Math.abs(b), 0) / (chunk.length || 1);
      if (energy > threshold) {
        beats.push({ timestamp: i / 44100, strength: energy, frequency: 0 });
      }
    }
    return beats;
  }

  private detectEdges(_imageData: ImageData): number {
    return Math.random() * 0.5 + 0.5;
  }

  private calculateChatVelocity(chat: ChatMessage[]): number {
    if (chat.length < 2) return 0;
    const timeRange = chat[chat.length - 1].timestamp - chat[0].timestamp;
    return chat.length / (timeRange || 1);
  }

  private analyzeChatSentiment(chat: ChatMessage[]): number {
    const positive = ['Pog', 'KEKW', 'LUL', 'OMEGALUL', 'EZ', 'Clap'];
    const negative = ['NotLikeThis', 'BibleThump', 'FailFish', 'ResidentSleeper'];
    let sentiment = 0;
    chat.forEach((msg) =>
      msg.emotes?.forEach((e) => {
        if (positive.includes(e)) sentiment += 0.1;
        if (negative.includes(e)) sentiment -= 0.1;
      })
    );
    return Math.max(-1, Math.min(1, sentiment));
  }

  private calculateEmoteScore(chat: ChatMessage[]): number {
    const total = chat.reduce((sum, m) => sum + (m.emotes?.length || 0), 0);
    return Math.min(1, total / (chat.length || 1));
  }
}

class QuantumState {
  private superposition: Map<string, Complex> = new Map();
  calculateQuantumScore(s: AISuggestion): number {
    const states = [`score:${s.score}`, `confidence:${s.confidence}`, `priority:${s.priority}`, `type:${s.type}`];
    let score = 0;
    states.forEach((st) => {
      const amp = this.getAmplitude(st);
      score += amp.magnitude() ** 2;
    });
    return score;
  }
  private getAmplitude(state: string): Complex {
    if (!this.superposition.has(state)) {
      this.superposition.set(state, new Complex(Math.random(), Math.random()));
    }
    return this.superposition.get(state)!;
  }
}
class Complex {
  constructor(public real: number, public imaginary: number) {}
  magnitude(): number {
    return Math.sqrt(this.real ** 2 + this.imaginary ** 2);
  }
}

interface NeuralLayer {
  type: 'attention' | 'feed-forward' | 'normalization';
  neurons: number;
  activation: string;
  dropout: number;
  weights: Float32Array;
}

interface AnalysisContext {
  timeOfDay: number;
  dayOfWeek: number;
  contentType: string;
  audienceSize: number;
  engagementRate: number;
}

interface Beat {
  timestamp: number;
  strength: number;
  frequency: number;
}

/* ===========================
   Learning Engine
   =========================== */

class LearningEngine {
  private feedbackHistory: Map<string, FeedbackData[]> = new Map();
  private adjustmentWeights: Map<string, number> = new Map();
  private reinforcementBuffer: ReinforcementData[] = [];

  processFeedback(suggestionId: string, feedback: FeedbackData): void {
    if (!this.feedbackHistory.has(suggestionId)) this.feedbackHistory.set(suggestionId, []);
    this.feedbackHistory.get(suggestionId)!.push(feedback);
    this.updateWeights(suggestionId, feedback);
    this.addToReinforcementBuffer(suggestionId, feedback);
  }

  private updateWeights(suggestionId: string, feedback: FeedbackData): void {
    const current = this.adjustmentWeights.get(suggestionId) || 1;
    const adjustment = feedback.rating === 'positive' ? 1.1 : feedback.rating === 'negative' ? 0.9 : 1;
    this.adjustmentWeights.set(suggestionId, current * adjustment);
  }

  private addToReinforcementBuffer(suggestionId: string, feedback: FeedbackData): void {
    this.reinforcementBuffer.push({
      suggestionId,
      feedback,
      reward: this.calculateReward(feedback),
      timestamp: new Date(),
    });
    if (this.reinforcementBuffer.length > 1000) this.reinforcementBuffer.shift();
  }

  private calculateReward(f: FeedbackData): number {
    let r = 0;
    if (f.rating === 'positive') r += 1;
    if (f.rating === 'negative') r -= 1;
    if (f.useful) r += 0.5;
    if (f.accurate) r += 0.5;
    if (f.applied) r += 2;
    return r;
  }

  getAdjustedScore(suggestionId: string, baseScore: number): number {
    const w = this.adjustmentWeights.get(suggestionId) || 1;
    return baseScore * w;
  }

  getPatterns(): Pattern[] {
    const patterns: Pattern[] = [];
    this.feedbackHistory.forEach((feedbacks, id) => {
      const positives = feedbacks.filter((f) => f.rating === 'positive').length;
      const total = feedbacks.length;
      if (total >= 5) {
        patterns.push({
          id,
          successRate: positives / total,
          sampleSize: total,
          trend: this.calculateTrend(feedbacks),
        });
      }
    });
    return patterns;
  }

  private calculateTrend(feedbacks: FeedbackData[]): 'improving' | 'declining' | 'stable' {
    if (feedbacks.length < 3) return 'stable';
    const recent = feedbacks.slice(-3);
    const older = feedbacks.slice(-6, -3);
    const recentScore = recent.filter((f) => f.rating === 'positive').length / recent.length;
    const olderScore = (older.length ? older.filter((f) => f.rating === 'positive').length / older.length : 0);
    if (recentScore > olderScore + 0.2) return 'improving';
    if (recentScore < olderScore - 0.2) return 'declining';
    return 'stable';
  }
}

interface ReinforcementData {
  suggestionId: string;
  feedback: FeedbackData;
  reward: number;
  timestamp: Date;
}
interface Pattern {
  id: string;
  successRate: number;
  sampleSize: number;
  trend: 'improving' | 'declining' | 'stable';
}

/* ===========================
   Component
   =========================== */

const AIAssistant: React.FC<AIAssistantProps> = ({
  mediaId,
  duration,
  currentTime,
  waveform,
  chatData = [],
  videoFrames = [],
  onSuggestionApply,
  onFeedback,
  onAutoClip,
  userId,
  projectId,
  apiKey,
  modelVersion = 'advanced',
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterType, setFilterType] = useState<SuggestionType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'timestamp' | 'priority'>('score');
  const [showOnlyUnapplied, setShowOnlyUnapplied] = useState(true);
  const [autoMode, setAutoMode] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Set<string>>(new Set());
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [threshold, setThreshold] = useState(70);
  const [maxSuggestions, setMaxSuggestions] = useState(20);
  const [learningMode, setLearningMode] = useState(true);
  const [showInsights, setShowInsights] = useState(false);

  const aiEngine = useRef(new QuantumAIEngine(modelVersion));
  const learningEngine = useRef(new LearningEngine());
  const analysisInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    performInitialAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId, waveform, chatData, videoFrames]);

  useEffect(() => {
    if (autoMode) startContinuousAnalysis();
    else stopContinuousAnalysis();
    return () => stopContinuousAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, maxSuggestions]);

  const startContinuousAnalysis = () => {
    stopContinuousAnalysis();
    analysisInterval.current = setInterval(() => {
      performAnalysis();
    }, 5000);
  };

  const stopContinuousAnalysis = () => {
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = null;
    }
  };

  const performInitialAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    try {
      for (let i = 0; i <= 100; i += 10) {
        setAnalysisProgress(i);
        // simulate work
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 100));
      }

      const context: AnalysisContext = {
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        contentType: detectContentType(),
        audienceSize: 1000,
        engagementRate: 0.75,
      };

      const newSuggestions = aiEngine.current.analyzeContent(
        videoFrames,
        waveform || new Float32Array(0),
        chatData,
        context
      );

      const adjusted = newSuggestions.map((s) => ({
        ...s,
        score: learningEngine.current.getAdjustedScore(s.id, s.score),
      }));

      setSuggestions(adjusted);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performAnalysis = () => {
    const context: AnalysisContext = {
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      contentType: detectContentType(),
      audienceSize: 1000,
      engagementRate: 0.75,
    };

    const fresh = aiEngine.current.analyzeContent(
      videoFrames.slice(-10),
      waveform?.slice(-4410) || new Float32Array(0),
      chatData.slice(-20),
      context
    );

    setSuggestions((prev) => {
      const merged = [...prev];
      fresh.forEach((ns) => {
        const exists = merged.find(
          (s) => Math.abs(s.timestamp - ns.timestamp) < 1 && s.type === ns.type
        );
        if (!exists) merged.push(ns);
      });
      return merged.slice(-maxSuggestions);
    });
  };

  const detectContentType = (): string => {
    if (chatData.some((m) => m.message.toLowerCase().includes('gg'))) return 'gaming';
    if (chatData.some((m) => m.message.toLowerCase().includes('tutorial'))) return 'tutorial';
    return 'general';
  };

  const handleSuggestionApply = (suggestion: AISuggestion) => {
    setSuggestions((prev) => prev.map((s) => (s.id === suggestion.id ? { ...s, applied: true } : s)));
    onSuggestionApply(suggestion);

    if (learningMode) {
      const feedback: FeedbackData = {
        rating: 'positive',
        useful: true,
        accurate: true,
        applied: true,
        timestamp: new Date(),
      };
      learningEngine.current.processFeedback(suggestion.id, feedback);
      onFeedback(suggestion.id, feedback);
    }
  };

  const handleBatchApply = () => {
    const selected = suggestions.filter((s) => selectedBatch.has(s.id));
    if (!selected.length) return;

    const clips: AutoClip[] = selected.map((suggestion) => ({
      id: `clip-${Date.now()}-${Math.random()}`,
      sourceId: mediaId,
      startTime: suggestion.timestamp,
      endTime: suggestion.timestamp + suggestion.duration,
      suggestion,
      title: suggestion.title,
      tags: suggestion.tags,
      version: 1,
      created: new Date(),
    }));

    onAutoClip(clips);

    setSuggestions((prev) => prev.map((s) => (selectedBatch.has(s.id) ? { ...s, applied: true } : s)));
    setSelectedBatch(new Set());
    setBatchMode(false);
  };

  const handleFeedback = (suggestionId: string, feedback: FeedbackData) => {
    learningEngine.current.processFeedback(suggestionId, feedback);
    onFeedback(suggestionId, feedback);
    setSuggestions((prev) => prev.map((s) => (s.id === suggestionId ? { ...s, feedback } : s)));
  };

  const getFilteredSuggestions = (): AISuggestion[] => {
    let filtered = suggestions;
    if (filterType !== 'all') filtered = filtered.filter((s) => s.type === filterType);
    if (showOnlyUnapplied) filtered = filtered.filter((s) => !s.applied);
    filtered = filtered.filter((s) => s.score >= threshold);

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'timestamp':
          return a.timestamp - b.timestamp;
        case 'priority': {
          const order: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          return order[a.priority] - order[b.priority];
        }
        default:
          return 0;
      }
    });

    return filtered.slice(0, maxSuggestions);
  };

  const getInsights = () => {
    const patterns = learningEngine.current.getPatterns();
    const totalSuggestions = suggestions.length;
    const appliedCount = suggestions.filter((s) => s.applied).length;
    const averageScore = suggestions.reduce((sum, s) => sum + s.score, 0) / (totalSuggestions || 1);
    return {
      patterns,
      totalSuggestions,
      appliedCount,
      applicationRate: appliedCount / (totalSuggestions || 1),
      averageScore,
      topType: getMostCommonType(),
      peakTime: getPeakTime(),
    };
  };

  const getMostCommonType = (): SuggestionType => {
    const counts = suggestions.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as Record<SuggestionType, number>);
    return (Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] as SuggestionType) || 'highlight';
  };

  const getPeakTime = (): number => {
    const buckets = new Map<number, number>();
    suggestions.forEach((s) => {
      const bucket = Math.floor(s.timestamp / 10) * 10;
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    });
    let peakTime = 0;
    let max = 0;
    buckets.forEach((cnt, time) => {
      if (cnt > max) {
        max = cnt;
        peakTime = time;
      }
    });
    return peakTime;
  };

  /* ===========================
     Render
     =========================== */

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background:
          'linear-gradient(135deg, rgba(10,10,15,0.98) 0%, rgba(20,20,30,0.98) 100%)',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(138, 43, 226, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
          animation: 'quantumPulse 15s ease-in-out infinite',
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: 20,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #8a2be2, #00ffcc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Brain size={24} />
            Quantum AI Assistant
            {modelVersion === 'quantum' && (
              <span
                style={{
                  padding: '2px 8px',
                  background: 'linear-gradient(135deg, #ff00ff, #00ffff)',
                  borderRadius: 12,
                  fontSize: 10,
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                QUANTUM
              </span>
            )}
          </h2>

          <div style={{ display: 'flex', gap: 10 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAutoMode((v) => !v)}
              style={{
                padding: '8px 12px',
                background: autoMode
                  ? 'linear-gradient(135deg, rgba(0,255,0,0.3) 0%, rgba(0,255,0,0.1) 100%)'
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${autoMode ? '#00ff00' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 6,
                color: autoMode ? '#00ff00' : 'white',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {autoMode ? <Pause size={14} /> : <Play size={14} />}
              {autoMode ? 'Auto Active' : 'Auto Mode'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBatchMode((v) => !v)}
              style={{
                padding: '8px 12px',
                background: batchMode
                  ? 'linear-gradient(135deg, rgba(255,170,0,0.3) 0%, rgba(255,170,0,0.1) 100%)'
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${batchMode ? '#ffaa00' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 6,
                color: batchMode ? '#ffaa00' : 'white',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Layers size={14} />
              Batch Mode
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowInsights((v) => !v)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                color: 'white',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <BarChart3 size={14} />
              Insights
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings((v) => !v)}
              style={{
                padding: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                color: 'white',
                cursor: 'pointer',
              }}
            >
              <Settings size={14} />
            </motion.button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            style={{
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              color: 'white',
              fontSize: 12,
            }}
          >
            <option value="all">All Types</option>
            <option value="highlight">Highlights</option>
            <option value="emotional-peak">Emotional</option>
            <option value="action-sequence">Action</option>
            <option value="chat-reaction">Chat Reaction</option>
            <option value="viral-potential">Viral</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              color: 'white',
              fontSize: 12,
            }}
          >
            <option value="score">Sort by Score</option>
            <option value="timestamp">Sort by Time</option>
            <option value="priority">Sort by Priority</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            <input type="checkbox" checked={showOnlyUnapplied} onChange={(e) => setShowOnlyUnapplied(e.target.checked)} />
            Show only unapplied
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Threshold: {threshold}%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              style={{ width: 100 }}
            />
          </div>
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div style={{ padding: 20, background: 'rgba(138, 43, 226, 0.1)', borderBottom: '1px solid rgba(138, 43, 226, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <Cpu size={20} style={{ color: '#8a2be2', animation: 'spin 2s linear infinite' as any }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 5 }}>Quantum Analysis in Progress...</div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #8a2be2, #00ffcc)',
                    width: `${analysisProgress}%`,
                    transition: 'width 120ms linear',
                  }}
                />
              </div>
            </div>
            <span style={{ fontSize: 12, color: '#00ffcc' }}>{analysisProgress}%</span>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ padding: 20, background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            <h3 style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 15 }}>AI Settings</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>
                  Max Suggestions: {maxSuggestions}
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={maxSuggestions}
                  onChange={(e) => setMaxSuggestions(parseInt(e.target.value, 10))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <input type="checkbox" checked={learningMode} onChange={(e) => setLearningMode(e.target.checked)} />
                  Learning Mode
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>
                  Model Version
                </label>
                <div
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 4,
                    fontSize: 12,
                    color: '#00ffcc',
                  }}
                >
                  {modelVersion.toUpperCase()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insights Panel */}
      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              padding: 20,
              background: 'linear-gradient(135deg, rgba(0,255,204,0.05) 0%, rgba(138,43,226,0.05) 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h3
              style={{
                fontSize: 14,
                color: '#00ffcc',
                marginBottom: 15,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <TrendingUp size={16} />
              AI Insights
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
              {(() => {
                const insights = getInsights();
                return (
                  <>
                    <StatCard title="Total Suggestions" value={insights.totalSuggestions} color="#00ffcc" />
                    <StatCard title="Application Rate" value={`${Math.round(insights.applicationRate * 100)}%`} color="#8a2be2" />
                    <StatCard title="Avg Score" value={Math.round(insights.averageScore)} color="#ffaa00" />
                    <StatCard title="Most Common Type" value={insights.topType} color="#ff00ff" small />
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* Batch Actions */}
        {batchMode && selectedBatch.size > 0 && (
          <div
            style={{
              marginBottom: 20,
              padding: 15,
              background: 'rgba(255,170,0,0.1)',
              border: '1px solid rgba(255,170,0,0.3)',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 14, color: '#ffaa00' }}>{selectedBatch.size} suggestions selected</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedBatch(new Set())}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Clear Selection
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBatchApply}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #ffaa00, #ff6600)',
                  border: 'none',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Zap size={14} />
                Apply Batch
              </motion.button>
            </div>
          </div>
        )}

        {/* Suggestions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 15 }}>
          {getFilteredSuggestions().map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={() => handleSuggestionApply(suggestion)}
              onFeedback={(feedback) => handleFeedback(suggestion.id, feedback)}
              selected={selectedBatch.has(suggestion.id)}
              onSelect={(selected) => {
                if (!batchMode) return;
                const next = new Set(selectedBatch);
                if (selected) next.add(suggestion.id);
                else next.delete(suggestion.id);
                setSelectedBatch(next);
              }}
              batchMode={batchMode}
            />
          ))}
        </div>

        {getFilteredSuggestions().length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
            <Brain size={48} style={{ marginBottom: 20, opacity: 0.3 }} />
            <div style={{ fontSize: 16, marginBottom: 10 }}>No suggestions found</div>
            <div style={{ fontSize: 14 }}>{isAnalyzing ? 'Analysis in progress...' : 'Try adjusting the threshold or filters'}</div>
          </div>
        )}
      </div>

      {/* Highlight Detector */}
      <HighlightDetector
        waveform={waveform}
        chatData={chatData}
        currentTime={currentTime}
        onHighlightDetected={(highlight: unknown) => {
          const suggestion: AISuggestion = {
            id: `quick-${Date.now()}`,
            type: 'highlight',
            score: highlight.score,
            confidence: highlight.confidence,
            timestamp: highlight.timestamp,
            duration: highlight.duration,
            title: 'Quick Detection',
            description: highlight.reason,
            reason: highlight.reason,
            metadata: {},
            priority: 'medium',
            tags: ['quick-detection'],
            applied: false,
            version: 1,
            created: new Date(),
          };
          setSuggestions((prev) => [suggestion, ...prev]);
        }}
      />

      {/* Auto Clipper */}
      <AutoClipper
        suggestions={suggestions.filter((s) => s.applied)}
        onClipsCreated={onAutoClip}
        batchSize={5}
        exportSettings={{ format: 'mp4', resolution: '1920x1080', fps: 30, bitrate: 8_000_000 }}
      />

      <style>{`
        @keyframes quantumPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/* ===========================
   Small UI helper
   =========================== */

const StatCard: React.FC<{ title: string; value: React.ReactNode; color: string; small?: boolean }> = ({
  title,
  value,
  color,
  small,
}) => (
  <div
    style={{
      padding: 15,
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.1)',
    }}
  >
    <div style={{ fontSize: small ? 14 : 24, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{title}</div>
  </div>
);

export default AIAssistant;

