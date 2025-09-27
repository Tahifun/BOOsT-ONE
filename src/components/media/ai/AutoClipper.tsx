import { logger } from '@/lib/logger';
?import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors, Zap, Download, CheckCircle, XCircle, Clock,
  Settings, Share2, Cpu, Package, Film
} from 'lucide-react';
import { AISuggestion, AutoClip } from './AIAssistant';

interface AutoClipperProps {
  suggestions: AISuggestion[];
  onClipsCreated: (clips: AutoClip[]) => void;
  batchSize?: number;
  exportSettings?: ExportSettings;
  autoProcess?: boolean;
  versionControl?: boolean;
  templatePresets?: ClipTemplate[];
}

interface ExportSettings {
  format: 'mp4' | 'webm' | 'mov' | 'gif';
  resolution: string;
  fps: number;
  bitrate: number;
  codec?: string;
  audioCodec?: string;
  preset?: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
}

interface ClipTemplate {
  id: string;
  name: string;
  intro?: ClipSegment;
  outro?: ClipSegment;
  watermark?: Watermark;
  transitions?: TransitionConfig;
  filters?: FilterConfig[];
  exportSettings: ExportSettings;
}

interface ClipSegment {
  duration: number;
  type: 'video' | 'image' | 'text';
  content: string;
  animation?: string;
}

interface Watermark {
  image: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  scale: number;
}

interface TransitionConfig {
  type: 'fade' | 'dissolve' | 'wipe' | 'slide';
  duration: number;
}

interface FilterConfig {
  type: string;
  parameters: unknown;
}

interface ClipVersion {
  id: string;
  clipId: string;
  version: number;
  changes: string[];
  timestamp: Date;
  author: string;
}

interface ProcessingJob {
  id: string;
  clipId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0..100
  startTime: Date;
  endTime?: Date;
  error?: string;
}

/* ============================= Engine ============================== */

class ClipProcessingEngine {
  private queue: ProcessingJob[] = [];
  private active: Map<string, ProcessingJob> = new Map();
  private history: ProcessingJob[] = []; // completed/failed
  private observers: Set<(jobs: ProcessingJob[]) => void> = new Set();
  private maxConcurrent = 3;
  // für schnellen Lookup: immer letztes Job-Objekt je Clip
  private latestByClip: Map<string, ProcessingJob> = new Map();
  private historyLimit = 200;

  addJob(clip: AutoClip): ProcessingJob {
    const job: ProcessingJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      clipId: clip.id,
      status: 'pending',
      progress: 0,
      startTime: new Date(),
    };
    this.queue.push(job);
    this.latestByClip.set(clip.id, job);
    this.processQueue(); // fire & forget
    this.notify();
    return job;
  }

  private async processQueue() {
    while (this.queue.length > 0 && this.active.size < this.maxConcurrent) {
      const job = this.queue.shift();
      if (!job) break;
      job.status = 'processing';
      this.active.set(job.id, job);
      this.latestByClip.set(job.clipId, job);
      this.notify();
      this.processJob(job);
    }
  }

  private async processJob(job: ProcessingJob) {
    try {
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        job.progress = Math.round((i / steps) * 100);
        this.notify();
        await new Promise((r) => setTimeout(r, 500));
      }
      job.status = 'completed';
      job.endTime = new Date();
    } catch (err) {
      job.status = 'failed';
      job.error = err instanceof Error ? err.message : String(err);
      job.endTime = new Date();
    } finally {
      // aus active entfernen, in history aufnehmen
      this.active.delete(job.id);
      this.history.push(job);
      if (this.history.length > this.historyLimit) this.history.shift();
      this.latestByClip.set(job.clipId, job); // final state
      this.notify();
      this.processQueue();
    }
  }

  subscribe(observer: (jobs: ProcessingJob[]) => void) {
    this.observers.add(observer);
    // initial push
    observer(this.snapshot());
    return () => this.observers.delete(observer);
  }

  getJobForClip(clipId: string): ProcessingJob | undefined {
    return this.latestByClip.get(clipId);
  }

  getStats(): ProcessingStats {
    const completed = this.history.filter((j) => j.status === 'completed').length;
    const failed = this.history.filter((j) => j.status === 'failed').length;
    const processing = Array.from(this.active.values()).length;
    const pending = this.queue.length;
    const total = pending + processing + completed + failed;
    const successRate = completed + failed > 0 ? completed / (completed + failed) : 0;
    return { total, completed, failed, pending, processing, successRate };
  }

  private snapshot(): ProcessingJob[] {
    // kompakte Liste für UI: active + pending + letzte History (begrenzt)
    return [
      ...Array.from(this.active.values()),
      ...this.queue,
      ...this.history.slice(-this.historyLimit),
    ];
  }

  private notify() {
    const snap = this.snapshot();
    this.observers.forEach((cb) => cb(snap));
  }
}

interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  successRate: number;
}

/* =========================== Versions ============================ */

class VersionControlSystem {
  private versions: Map<string, ClipVersion[]> = new Map();

  createVersion(clip: AutoClip, changes: string[]): ClipVersion {
    const arr = this.versions.get(clip.id) || [];
    const version: ClipVersion = {
      id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      clipId: clip.id,
      version: arr.length + 1,
      changes,
      timestamp: new Date(),
      author: 'Current User',
    };
    arr.push(version);
    this.versions.set(clip.id, arr);
    return version;
  }

  getVersions(clipId: string): ClipVersion[] {
    return this.versions.get(clipId) || [];
  }
}

/* ============================ Component =========================== */

const AutoClipper: React.FC<AutoClipperProps> = ({
  suggestions,
  onClipsCreated,
  batchSize = 5,
  exportSettings = {
    format: 'mp4',
    resolution: '1920x1080',
    fps: 30,
    bitrate: 8_000_000,
    preset: 'medium',
  },
  autoProcess = false,
  versionControl = true,
  templatePresets = [],
}) => {
  const [clips, setClips] = useState<AutoClip[]>([]);
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ClipTemplate | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<ExportSettings>(exportSettings);
  const [stats, setStats] = useState<ProcessingStats>({
    total: 0, completed: 0, failed: 0, pending: 0, processing: 0, successRate: 0,
  });
  const [versions, setVersions] = useState<Map<string, ClipVersion[]>>(new Map());

  const processingEngine = useRef(new ClipProcessingEngine());
  const versionSystem = useRef(new VersionControlSystem());
  const createdFromSuggestions = useRef<Set<string>>(new Set()); // dedupe

  // subscribe to engine updates
  useEffect(() => {
    const unsubscribe = processingEngine.current.subscribe((jobs) => {
      setProcessingJobs(jobs);
      setStats(processingEngine.current.getStats());
    });
    return unsubscribe;
  }, []);

  // auto process new suggestions (deduped)
  useEffect(() => {
    if (!autoProcess || suggestions.length === 0) return;
    const fresh = suggestions
      .filter((s) => !createdFromSuggestions.current.has(s.id))
      .slice(0, batchSize);
    if (fresh.length === 0) return;

    const newClips = createClipsFromSuggestions(fresh);
    processClips(newClips);
    fresh.forEach((s) => createdFromSuggestions.current.add(s.id));
  }, [suggestions, autoProcess, batchSize]);

  const applyTemplate = (clip: AutoClip, template: ClipTemplate): AutoClip =>
    ({ ...clip, exportSettings: template.exportSettings });

  const createClipsFromSuggestions = (sugs: AISuggestion[]): AutoClip[] =>
    sugs.map((s) => ({
      id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceId: 'media-source',
      startTime: Math.max(0, s.timestamp),
      endTime: Math.max(s.timestamp, s.timestamp + s.duration),
      suggestion: s,
      title: generateTitle(s),
      tags: s.tags,
      exportSettings: currentSettings,
      version: 1,
      created: new Date(),
    }));

  const processClips = async (clipsToProcess: AutoClip[]) => {
    let queue = clipsToProcess;
    if (selectedTemplate) {
      queue = queue.map((c) => applyTemplate(c, selectedTemplate));
    }

    // add jobs
    queue.forEach((clip) => processingEngine.current.addJob(clip));

    // add to local list
    setClips((prev) => [...prev, ...queue]);

    // initial versions
    if (versionControl) {
      queue.forEach((clip) => {
        const v = versionSystem.current.createVersion(clip, ['Initial creation from AI suggestion']);
        setVersions((prev) => {
          const next = new Map(prev);
          next.set(clip.id, [v]);
          return next;
        });
      });
    }

    // notify parent immediately
    onClipsCreated(queue);
  };

  const handleExportClip = async (clipId: string) => {
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return;
    // simulate export side-effect (already processed by engine)
    logger.debug('Export clip', clip.id, 'as', currentSettings.format);

    if (versionControl) {
      const v = versionSystem.current.createVersion(clip, [`Exported as ${currentSettings.format}`]);
      setVersions((prev) => {
        const next = new Map(prev);
        next.set(clip.id, [...(next.get(clip.id) || []), v]);
        return next;
      });
    }
  };

  const handleDeleteClip = (clipId: string) => {
    setClips((prev) => prev.filter((c) => c.id !== clipId));
  };

  const getJobForClip = (clipId: string): ProcessingJob | undefined =>
    processingEngine.current.getJobForClip(clipId);

  const formatFileSize = (bitrate: number, duration: number): string => {
    const bytes = (bitrate * duration) / 8;
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  };

  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(20,20,30,0.95) 100%)',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.1)',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{
          fontSize: 18, fontWeight: 700, margin: 0,
          background: 'linear-gradient(135deg, #00ffcc, #8a2be2)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Scissors size={20} />
          Auto Clipper
        </h3>

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings((v) => !v)}
            style={{
              padding: 8, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: 'white', cursor: 'pointer',
            }}
            aria-label="Toggle export settings"
          >
            <Settings size={14} />
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20,
        padding: 15, background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <Stat label="Total Clips" value={stats.total} color="#00ffcc" />
        <Stat label="Processing" value={stats.processing} color="#ffaa00" />
        <Stat label="Completed" value={stats.completed} color="#00ff00" />
        <Stat label="Failed" value={stats.failed} color="#ff4444" />
        <Stat label="Success Rate" value={`${Math.round(stats.successRate * 100)}%`} color="#8a2be2" />
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginBottom: 20, padding: 20, background: 'rgba(0,0,0,0.5)',
              borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h4 style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 15 }}>Export Settings</h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
              <Labeled>
                <label>Format</label>
                <select
                  value={currentSettings.format}
                  onChange={(e) => setCurrentSettings({ ...currentSettings, format: e.target.value as any })}
                  style={selectStyle}
                >
                  <option value="mp4">MP4</option>
                  <option value="webm">WebM</option>
                  <option value="mov">MOV</option>
                  <option value="gif">GIF</option>
                </select>
              </Labeled>

              <Labeled>
                <label>Resolution</label>
                <select
                  value={currentSettings.resolution}
                  onChange={(e) => setCurrentSettings({ ...currentSettings, resolution: e.target.value })}
                  style={selectStyle}
                >
                  <option value="1920x1080">1080p</option>
                  <option value="1280x720">720p</option>
                  <option value="854x480">480p</option>
                  <option value="3840x2160">4K</option>
                </select>
              </Labeled>

              <Labeled>
                <label>FPS</label>
                <input
                  type="number"
                  value={currentSettings.fps}
                  onChange={(e) => setCurrentSettings({ ...currentSettings, fps: parseInt(e.target.value || '0', 10) })}
                  style={inputStyle}
                />
              </Labeled>
            </div>

            {/* Templates */}
            {templatePresets.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                  Template Preset
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {templatePresets.map((tpl) => (
                    <motion.button
                      key={tpl.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedTemplate(tpl)}
                      style={{
                        padding: '8px 12px',
                        background: selectedTemplate?.id === tpl.id
                          ? 'linear-gradient(135deg, rgba(0,255,204,0.3), rgba(0,255,204,0.1))'
                          : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${selectedTemplate?.id === tpl.id ? '#00ffcc' : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: 6,
                        color: selectedTemplate?.id === tpl.id ? '#00ffcc' : 'white',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {tpl.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clips List */}
      <div style={{ display: 'grid', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
        {clips.map((clip) => {
          const job = getJobForClip(clip.id);
          const clipVersions = versions.get(clip.id) || [];
          const lastVersion = clipVersions[clipVersions.length - 1];

          return (
            <motion.div
              key={clip.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                padding: 15,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 15,
              }}
            >
              {/* Status */}
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background:
                  job?.status === 'completed' ? 'rgba(0,255,0,0.1)' :
                  job?.status === 'processing' ? 'rgba(255,170,0,0.1)' :
                  job?.status === 'failed' ? 'rgba(255,0,0,0.1)' :
                  'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {job?.status === 'completed' && <CheckCircle size={20} color="#00ff00" />}
                {job?.status === 'processing' && <Cpu size={20} color="#ffaa00" className="animate-spin" />}
                {job?.status === 'failed' && <XCircle size={20} color="#ff4444" />}
                {job?.status === 'pending' && <Clock size={20} color="rgba(255,255,255,0.6)" />}
                {!job && <Film size={20} color="rgba(255,255,255,0.6)" />}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4 }}>
                  {clip.title}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'flex', gap: 10 }}>
                  <span>{formatTime(clip.startTime)} - {formatTime(clip.endTime)}</span>
                  <span>�?�</span>
                  <span>{formatFileSize(currentSettings.bitrate, clip.endTime - clip.startTime)}</span>
                  {versionControl && lastVersion && (
                    <>
                      <span>�?�</span>
                      <span>v{lastVersion.version}</span>
                    </>
                  )}
                </div>

                {/* Progress */}
                {job?.status === 'processing' && (
                  <div style={{
                    marginTop: 8, height: 4, background: 'rgba(255,255,255,0.1)',
                    borderRadius: 2, overflow: 'hidden',
                  }}>
                    <motion.div
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #ffaa00, #ff6600)',
                        width: `${job.progress}%`,
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${job.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => handleExportClip(clip.id)}
                  disabled={job?.status === 'processing'}
                  style={{
                    padding: 8,
                    background: 'rgba(0,255,204,0.1)',
                    border: '1px solid rgba(0,255,204,0.3)',
                    borderRadius: 4,
                    color: '#00ffcc',
                    cursor: job?.status === 'processing' ? 'not-allowed' : 'pointer',
                    opacity: job?.status === 'processing' ? 0.5 : 1,
                  }}
                  aria-label="Export clip"
                  title="Export"
                >
                  <Download size={14} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{
                    padding: 8, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 4, color: 'white', cursor: 'pointer',
                  }}
                  aria-label="Share clip"
                  title="Share"
                >
                  <Share2 size={14} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => handleDeleteClip(clip.id)}
                  style={{
                    padding: 8,
                    background: 'rgba(255,0,0,0.1)',
                    border: '1px solid rgba(255,0,0,0.3)',
                    borderRadius: 4, color: '#ff4444', cursor: 'pointer',
                  }}
                  aria-label="Delete clip"
                  title="Delete"
                >
                  <XCircle size={14} />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {clips.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.6)' }}>
          <Package size={48} style={{ marginBottom: 15, opacity: 0.3 }} />
          <div style={{ fontSize: 14 }}>No clips created yet</div>
          <div style={{ fontSize: 12, marginTop: 5 }}>Apply AI suggestions to create clips automatically</div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

/* ============================ Helpers ============================ */

const Stat: React.FC<{ label: string; value: number | string; color: string }> = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{label}</div>
  </div>
);

const Labeled: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>
    <div style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }} />
    {children}
  </div>
);

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: 8,
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 4,
  color: 'white',
  fontSize: 12,
};

const inputStyle = { ...selectStyle } as React.CSSProperties;

const formatTime = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
};

const generateTitle = (s: AISuggestion): string => {
  return `${s.type.replace('-', ' ')} �?" ${formatTime(s.timestamp)}`;
};

export default AutoClipper;

