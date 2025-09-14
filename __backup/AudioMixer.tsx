import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Keyboard, AlertTriangle, Settings, Download, Upload, Trash2,
  Unlock, Lock, Cpu, Grid, Layers, Hash, BarChart3, Binary
} from 'lucide-react';

/* ========================= Types ========================= */

export interface Hotkey {
  id: string;
  keys: string[];             // e.g. ['ctrl','s'] oder Sequenz: ['g'] + ['g'] -> als 'g g' registrieren
  action: string;
  description: string;
  category: HotkeyCategory;
  scope: HotkeyScope;
  enabled: boolean;
  conflict?: string;
  lastUsed?: Date;
  useCount: number;
  customizable: boolean;
  priority: number;
}

type HotkeyCategory =
  | 'playback'
  | 'navigation'
  | 'editing'
  | 'volume'
  | 'effects'
  | 'recording'
  | 'system'
  | 'custom';

type HotkeyScope = 'global' | 'focused' | 'modal';

interface HotkeyConflict {
  hotkey1: Hotkey;
  hotkey2: Hotkey;
  severity: 'warning' | 'error';
  resolution?: ConflictResolution;
}

interface ConflictResolution {
  type: 'disable' | 'remap' | 'priority';
  targetId: string;
  newKeys?: string[];
}

interface HotkeyManagerProps {
  hotkeys: Hotkey[];
  onHotkeyUpdate: (hotkey: Hotkey) => void;
  onHotkeyDelete: (hotkeyId: string) => void;
  onHotkeyAdd: (hotkey: Hotkey) => void;
  onAction: (action: string, event: KeyboardEvent) => void;
  enableGlobalShortcuts?: boolean;
  showVisualFeedback?: boolean;
  enableConflictDetection?: boolean;
  profile?: HotkeyProfile;
  onProfileChange?: (profile: HotkeyProfile) => void;
}

interface HotkeyProfile {
  id: string;
  name: string;
  hotkeys: Hotkey[];
  isDefault: boolean;
  created: Date;
  modified: Date;
}

/* ====================== Hotkey Engine ====================== */

interface KeyEvent {
  type: 'keydown' | 'keyup';
  key: string;
  timestamp: number;
  modifiers: string[];
}

interface HotkeyStats {
  useCount: number;
  lastUsed: Date;
  averageDelay: number;
  successRate: number;
}

const isEditableTarget = (ev: Event) => {
  const el = ev.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    (el as HTMLElement).isContentEditable === true
  );
};

const ORDERED_MODS = ['cmd', 'ctrl', 'alt', 'shift'] as const;
const canonicalizeKeys = (keys: string[]) => {
  const lower = keys.map(k => k.toLowerCase());
  const mods = ORDERED_MODS.filter(m => lower.includes(m));
  const main = lower.filter(k => !mods.includes(k as any));
  return [...mods, ...main].join('+');
};

class QuantumHotkeyEngine {
  private listeners = new Map<string, Set<(event: KeyboardEvent) => void>>();
  private pressedKeys = new Set<string>();
  private keySequence: string[] = [];
  private sequenceTimeout: ReturnType<typeof setTimeout> | null = null;
  private statistics = new Map<string, HotkeyStats>();
  private recordingGuard = false;

  constructor() {
    if (typeof document === 'undefined') return; // SSR safe
    document.addEventListener('keydown', this.handleKeyDown, true);
    document.addEventListener('keyup', this.handleKeyUp, true);
    window.addEventListener('blur', this.handleBlur);
  }

  /** blockt Auslösung während Recording */
  setRecordingGuard(active: boolean) {
    this.recordingGuard = active;
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    // Tippfelder respektieren (aber Hotkeys mit cmd/ctrl dürfen UI-Shortcuts überschreiben)
    if (!this.recordingGuard && isEditableTarget(event) && !(event.ctrlKey || event.metaKey)) {
      return;
    }

    const key = this.normalizeKey(event);
    this.pressedKeys.add(key);
    this.keySequence.push(key);

    if (this.sequenceTimeout) clearTimeout(this.sequenceTimeout);
    this.sequenceTimeout = setTimeout(() => (this.keySequence = []), 1000);

    if (this.recordingGuard) {
      // beim Recording keine Hotkeys feuern
      return;
    }

    this.checkHotkeys(event);
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const key = this.normalizeKey(event);
    this.pressedKeys.delete(key);
  };

  private handleBlur = () => {
    this.pressedKeys.clear();
    this.keySequence = [];
  };

  private normalizeKey(event: KeyboardEvent): string {
    const k = event.key.toLowerCase();
    const map: Record<string, string> = {
      ' ': 'space',
      arrowup: 'up',
      arrowdown: 'down',
      arrowleft: 'left',
      arrowright: 'right',
      control: 'ctrl',
      meta: 'cmd',
      escape: 'esc',
      return: 'enter',
    };
    return map[k] || k;
  }

  private matchesPattern(pattern: string, currentKeys: string[], sequence: string[]) {
    if (pattern.includes(' ')) {
      const seq = pattern.split(' ');
      if (sequence.length < seq.length) return false;
      const tail = sequence.slice(-seq.length);
      return tail.every((k, i) => k === seq[i]);
    }
    const pat = pattern.split('+').sort();
    const cur = [...currentKeys].sort();
    return pat.length === cur.length && pat.every((k, i) => k === cur[i]);
  }

  private checkHotkeys(event: KeyboardEvent) {
    const currentKeys = Array.from(this.pressedKeys);
    this.listeners.forEach((callbacks, pattern) => {
      if (this.matchesPattern(pattern, currentKeys, this.keySequence)) {
        // Standard-Browseraktionen bei Mod-Kombos verhindern (z. B. Ctrl+S)
        if (pattern.includes('ctrl') || pattern.includes('cmd') || pattern.includes('alt')) {
          event.preventDefault();
        }
        callbacks.forEach(cb => cb(event));
        this.updateStats(pattern);
      }
    });
  }

  register(pattern: string, fn: (event: KeyboardEvent) => void) {
    const p = pattern.toLowerCase();
    if (!this.listeners.has(p)) this.listeners.set(p, new Set());
    this.listeners.get(p)!.add(fn);
    return () => {
      const set = this.listeners.get(p);
      if (!set) return;
      set.delete(fn);
      if (set.size === 0) this.listeners.delete(p);
    };
  }

  detectConflicts(hotkeys: Hotkey[]): HotkeyConflict[] {
    const conflicts: HotkeyConflict[] = [];
    const map = new Map<string, Hotkey[]>();

    hotkeys.forEach(h => {
      const key = canonicalizeKeys(h.keys);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    });

    map.forEach(list => {
      if (list.length > 1) {
        for (let i = 0; i < list.length - 1; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i], b = list[j];
            const severity =
              a.scope === b.scope || a.scope === 'global' || b.scope === 'global'
                ? 'error'
                : 'warning';
            conflicts.push({ hotkey1: a, hotkey2: b, severity });
          }
        }
      }
    });

    // einfache Partial-Conflicts (Subset)
    const pats = hotkeys.map(h => ({ h, p: canonicalizeKeys(h.keys) }));
    for (let i = 0; i < pats.length; i++) {
      for (let j = i + 1; j < pats.length; j++) {
        const a = pats[i], b = pats[j];
        if (a.p !== b.p && (a.p.startsWith(b.p) || b.p.startsWith(a.p))) {
          conflicts.push({ hotkey1: a.h, hotkey2: b.h, severity: 'warning' });
        }
      }
    }

    return conflicts;
  }

  private updateStats(pattern: string) {
    const now = new Date();
    const s = this.statistics.get(pattern) || {
      useCount: 0,
      lastUsed: now,
      averageDelay: 0,
      successRate: 1,
    };
    s.useCount += 1;
    s.lastUsed = now;
    this.statistics.set(pattern, s);
  }

  getStatistics() {
    return new Map(this.statistics);
  }

  dispose() {
    if (typeof document === 'undefined') return;
    document.removeEventListener('keydown', this.handleKeyDown, true);
    document.removeEventListener('keyup', this.handleKeyUp, true);
    window.removeEventListener('blur', this.handleBlur);
    this.listeners.clear();
    this.pressedKeys.clear();
  }
}

/* ===================== Simple Predictor ===================== */

class NeuralHotkeyPredictor {
  analyze(hotkeys: Hotkey[], stats: Map<string, HotkeyStats>) {
    const suggestions: HotkeySuggestion[] = [];
    const statByHotkey = (h: Hotkey) => stats.get(canonicalizeKeys(h.keys));

    const unused = hotkeys.filter(h => (statByHotkey(h)?.useCount ?? 0) < 5);
    const frequent = hotkeys.filter(h => (statByHotkey(h)?.useCount ?? 0) > 20);

    unused.forEach(h => suggestions.push({
      type: 'remove', hotkey: h, reason: 'Rarely used hotkey', confidence: 0.7
    }));

    frequent.forEach(h => {
      if (h.keys.length > 2) {
        suggestions.push({
          type: 'simplify', hotkey: h, reason: 'Frequently used action with complex shortcut',
          newKeys: ['ctrl', h.keys[h.keys.length - 1]], confidence: 0.8
        });
      }
    });

    const byCat = new Map<HotkeyCategory, Hotkey[]>();
    hotkeys.forEach(h => {
      if (!byCat.has(h.category)) byCat.set(h.category, []);
      byCat.get(h.category)!.push(h);
    });
    byCat.forEach((list, category) => {
      if (list.length > 3) {
        const firsts = new Set(list.map(h => h.keys[0]?.toLowerCase() || ''));
        if (firsts.size > 2) {
          suggestions.push({
            type: 'reorganize', category, reason: 'Inconsistent key patterns in category', confidence: 0.6
          });
        }
      }
    });

    return suggestions;
  }
}

interface HotkeySuggestion {
  type: 'remove' | 'simplify' | 'reorganize' | 'add';
  hotkey?: Hotkey;
  category?: HotkeyCategory;
  reason: string;
  newKeys?: string[];
  confidence: number;
}

/* ========================= Component ========================= */

const HotkeyManager: React.FC<HotkeyManagerProps> = ({
  hotkeys,
  onHotkeyUpdate,
  onHotkeyDelete,
  onHotkeyAdd,
  onAction,
  enableGlobalShortcuts = true,
  showVisualFeedback = true,
  enableConflictDetection = true,
  profile,
  onProfileChange
}) => {
  const [editingHotkey, setEditingHotkey] = useState<string | null>(null);
  const [recordingHotkey, setRecordingHotkey] = useState<string | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<HotkeyConflict[]>([]);
  const [suggestions, setSuggestions] = useState<HotkeySuggestion[]>([]);
  const [statistics, setStatistics] = useState<Map<string, HotkeyStats>>(new Map());
  const [showStats, setShowStats] = useState(false);
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HotkeyCategory | 'all'>('all');
  const [macroMode, setMacroMode] = useState(false);
  const [currentMacro, setCurrentMacro] = useState<KeyEvent[]>([]);

  const engineRef = useRef<QuantumHotkeyEngine | null>(null);
  const predictorRef = useRef(new NeuralHotkeyPredictor());
  const recordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRecordingGlobalListener = useRef<(() => void) | null>(null);

  // init engine (SSR-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    engineRef.current = new QuantumHotkeyEngine();
    return () => engineRef.current?.dispose();
  }, []);

  // register hotkeys
  useEffect(() => {
    if (!engineRef.current) return;
    const unsub: Array<() => void> = [];

    hotkeys.forEach(h => {
      if (!h.enabled) return;
      if (!enableGlobalShortcuts && h.scope === 'global') return;

      const pattern = canonicalizeKeys(h.keys);
      const off = engineRef.current!.register(pattern, (ev) => {
        // Visual feedback
        if (showVisualFeedback) {
          setLastTriggered(h.id);
          setTimeout(() => setLastTriggered(null), 800);
        }
        // Action
        onAction(h.action, ev);
        // Update usage
        onHotkeyUpdate({ ...h, lastUsed: new Date(), useCount: h.useCount + 1 });
        // refresh stats/suggestions on trigger
        setStatistics(engineRef.current!.getStatistics());
        setSuggestions(predictorRef.current.analyze(hotkeys, engineRef.current!.getStatistics()));
      });
      unsub.push(off);
    });

    return () => unsub.forEach(f => f());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotkeys, enableGlobalShortcuts, onAction, onHotkeyUpdate, showVisualFeedback]);

  // conflict detection
  useEffect(() => {
    if (!enableConflictDetection || !engineRef.current) return;
    setConflicts(engineRef.current.detectConflicts(hotkeys));
  }, [hotkeys, enableConflictDetection]);

  /* ---------- Recording (reliable, global, blocking) ---------- */

  const startRecording = (hotkeyId: string) => {
    if (!engineRef.current) return;
    setRecordingHotkey(hotkeyId);
    setRecordedKeys([]);
    engineRef.current.setRecordingGuard(true);

    const keydown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const keys: string[] = [];
      if (e.metaKey) keys.push('cmd');
      if (e.ctrlKey) keys.push('ctrl');
      if (e.altKey) keys.push('alt');
      if (e.shiftKey) keys.push('shift');
      const k = e.key.toLowerCase();
      if (!['control', 'meta', 'alt', 'shift'].includes(k)) keys.push(k);
      if (keys.length) setRecordedKeys(keys);
    };
    window.addEventListener('keydown', keydown, true);

    stopRecordingGlobalListener.current = () => window.removeEventListener('keydown', keydown, true);

    // auto-stop nach 3s
    recordTimer.current = setTimeout(() => stopRecording(), 3000);
  };

  const stopRecording = () => {
    if (recordTimer.current) clearTimeout(recordTimer.current);
    stopRecordingGlobalListener.current?.();
    stopRecordingGlobalListener.current = null;

    if (recordingHotkey && recordedKeys.length > 0) {
      const hk = hotkeys.find(h => h.id === recordingHotkey);
      if (hk) onHotkeyUpdate({ ...hk, keys: recordedKeys });
    }
    setRecordingHotkey(null);
    setRecordedKeys([]);
    engineRef.current?.setRecordingGuard(false);
  };

  /* ---------- Macro (simple buffer – optional) ---------- */

  const startMacroRecording = () => {
    setMacroMode(true);
    setCurrentMacro([]);
    engineRef.current?.setRecordingGuard(true);

    const press = (type: 'keydown' | 'keyup') => (e: KeyboardEvent) => {
      if (isEditableTarget(e)) return;
      const mods: string[] = [];
      if (e.ctrlKey) mods.push('ctrl');
      if (e.altKey) mods.push('alt');
      if (e.shiftKey) mods.push('shift');
      if (e.metaKey) mods.push('cmd');
      setCurrentMacro(prev => [...prev, {
        type,
        key: e.key,
        timestamp: Date.now(),
        modifiers: mods
      }]);
      e.preventDefault();
      e.stopPropagation();
    };

    const down = press('keydown');
    const up = press('keyup');
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);

    stopRecordingGlobalListener.current = () => {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
    };
  };

  const stopMacroRecording = () => {
    stopRecordingGlobalListener.current?.();
    stopRecordingGlobalListener.current = null;
    setMacroMode(false);
    engineRef.current?.setRecordingGuard(false);
  };

  const playMacro = () => {
    // Sicherheitsmaßnahme: keine echten KeyboardEvents dispatchen (Browser lassen vieles eh nicht zu).
    // Stattdessen triggern wir die registrierten Muster best-effort (nur Mod-Kombos).
    if (!engineRef.current) return;
    const seq = [...currentMacro];
    // naive Emulation: nur keydown mit Mod-Kombos sammeln
    seq.forEach((e, i) => {
      if (e.type !== 'keydown') return;
      const pattern = canonicalizeKeys([...e.modifiers, e.key.toLowerCase()]);
      // Ein Fake-Event an Listener reichen
      const fake = new KeyboardEvent('keydown', {
        key: e.key,
        ctrlKey: e.modifiers.includes('ctrl'),
        altKey: e.modifiers.includes('alt'),
        shiftKey: e.modifiers.includes('shift'),
        metaKey: e.modifiers.includes('cmd')
      });
      // Da Engine intern iteriert, rufen wir check indirekt über register-Callbacks (nicht öffentlich) nicht auf.
      // Realistisch: Macro-Wiedergabe steuert deine Actions direkt:
      onAction(pattern, fake);
    });
  };

  /* ---------- UI helpers ---------- */

  const filteredHotkeys = hotkeys.filter(h => {
    const catOk = selectedCategory === 'all' || h.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const textOk =
      q === '' ||
      h.description.toLowerCase().includes(q) ||
      h.action.toLowerCase().includes(q) ||
      canonicalizeKeys(h.keys).includes(q);
    return catOk && textOk;
  });

  const getCategoryIcon = (category: HotkeyCategory) => {
    const icons: Record<HotkeyCategory, JSX.Element> = {
      playback: <Play />,
      navigation: <Navigation />,
      editing: <Edit3 />,
      volume: <Volume2 />,
      effects: <Sparkles />,
      recording: <Disc />,
      system: <Settings size={14} />,
      custom: <Layers size={14} />
    };
    return icons[category] || <Hash size={14} />;
  };

  const exportHotkeys = () => {
    const config = {
      version: '1.0',
      profile: profile?.name || 'default',
      hotkeys,
      exported: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotkeys-${profile?.name || 'default'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importHotkeys = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = ev => {
      try {
        const cfg = JSON.parse(String(ev.target?.result || '{}'));
        (cfg.hotkeys || []).forEach((hk: Hotkey) => onHotkeyAdd(hk));
        if (cfg.profile && onProfileChange) {
          onProfileChange({
            id: `profile-${Date.now()}`,
            name: cfg.profile,
            hotkeys: cfg.hotkeys,
            isDefault: false,
            created: new Date(),
            modified: new Date()
          });
        }
      } catch (err) {
        console.error('Failed to import hotkeys:', err);
      }
    };
    rd.readAsText(file);
  };

  const createHotkey = () => {
    const hk: Hotkey = {
      id: `hotkey-${Date.now()}`,
      keys: ['ctrl', 'n'],
      action: 'new-action',
      description: 'New hotkey',
      category: 'custom',
      scope: 'focused',
      enabled: true,
      useCount: 0,
      customizable: true,
      priority: 0
    };
    onHotkeyAdd(hk);
    setEditingHotkey(hk.id);
  };

  const resolveConflict = (conflict: HotkeyConflict, res: ConflictResolution) => {
    if (res.type === 'disable') {
      const hk = hotkeys.find(h => h.id === res.targetId);
      if (hk) onHotkeyUpdate({ ...hk, enabled: false });
    } else if (res.type === 'remap' && res.newKeys) {
      const hk = hotkeys.find(h => h.id === res.targetId);
      if (hk) onHotkeyUpdate({ ...hk, keys: res.newKeys });
    } else if (res.type === 'priority') {
      const { hotkey1, hotkey2 } = conflict;
      if (res.targetId === hotkey1.id) onHotkeyUpdate({ ...hotkey1, priority: hotkey2.priority + 1 });
      else onHotkeyUpdate({ ...hotkey2, priority: hotkey1.priority + 1 });
    }
  };

  return (
    <div style={{
      padding: 20,
      background: 'linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(20,20,30,0.95) 100%)',
      borderRadius: 12,
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{
          fontSize: 18, fontWeight: 700, margin: 0,
          background: 'linear-gradient(135deg, #8a2be2, #00ffcc)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <Keyboard size={20} />
          Hotkey Manager
        </h3>

        <div style={{ display: 'flex', gap: 10 }}>
          {!macroMode ? (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={startMacroRecording}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,0,0,0.1)',
                border: '1px solid rgba(255,0,0,0.3)',
                borderRadius: 6, color: '#ff4444', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Binary size={14} />
              Record Macro
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={stopMacroRecording}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,0,0,0.3)',
                border: '1px solid #ff4444',
                borderRadius: 6, color: 'white', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, animation: 'pulse 1s infinite'
              }}
            >
              <Square />
              Stop Recording
            </motion.button>
          )}

          {currentMacro.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={playMacro}
              style={{
                padding: '8px 12px',
                background: 'rgba(0,255,0,0.1)',
                border: '1px solid rgba(0,255,0,0.3)',
                borderRadius: 6, color: '#00ff00', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Play />
              Play Macro ({currentMacro.length})
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowStats(s => !s)}
            style={{
              padding: 8,
              background: showStats ? 'rgba(138,43,226,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showStats ? '#8a2be2' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: 6, color: showStats ? '#8a2be2' : 'white', cursor: 'pointer'
            }}
            title="Toggle stats"
          >
            <BarChart3 size={14} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={createHotkey}
            style={{
              padding: '8px 12px',
              background: 'linear-gradient(135deg, #00ffcc, #00aaff)',
              border: 'none', borderRadius: 6, color: 'black', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <Plus />
            Add Hotkey
          </motion.button>
        </div>
      </div>

      {/* Filter & Export/Import */}
      <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
        <input
          type="text" placeholder="Search hotkeys..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: 1, padding: '8px 12px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6, color: 'white', fontSize: 12
          }}
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value as any)}
          style={{
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6, color: 'white', fontSize: 12
          }}
        >
          <option value="all">All Categories</option>
          <option value="playback">Playback</option>
          <option value="navigation">Navigation</option>
          <option value="editing">Editing</option>
          <option value="volume">Volume</option>
          <option value="effects">Effects</option>
          <option value="recording">Recording</option>
          <option value="system">System</option>
          <option value="custom">Custom</option>
        </select>

        <div style={{ display: 'flex', gap: 5 }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={exportHotkeys}
            style={{
              padding: 8, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: 'white', cursor: 'pointer'
            }}>
            <Download size={14} />
          </motion.button>

          <label style={{
            padding: 8, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: 'white',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <Upload size={14} />
            <input type="file" accept=".json" onChange={importHotkeys} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div style={{
          padding: 12, background: 'rgba(255,170,0,0.1)',
          border: '1px solid rgba(255,170,0,0.3)', borderRadius: 8, marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ffaa00', fontSize: 13 }}>
            <AlertTriangle size={16} />
            {conflicts.length} hotkey conflict{conflicts.length > 1 ? 's' : ''} detected
          </div>
        </div>
      )}

      {/* Optional Stats */}
      {showStats && (
        <div style={{
          padding: 12, background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 20
        }}>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 6 }}>Top shortcuts</div>
          {[...statistics.entries()].sort((a, b) => (b[1].useCount - a[1].useCount)).slice(0, 5).map(([p, st]) => (
            <div key={p} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              {p} — {st.useCount}× (last: {new Date(st.lastUsed).toLocaleTimeString()})
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{
          padding: 12, background: 'rgba(138,43,226,0.1)',
          border: '1px solid rgba(138,43,226,0.3)', borderRadius: 8, marginBottom: 20
        }}>
          <div style={{ fontSize: 13, color: '#8a2be2', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={16} />
            AI Suggestions
          </div>
          {suggestions.slice(0, 3).map((s, i) => (
            <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>
              • {s.reason}{s.newKeys ? ` → ${s.newKeys.join('+')}` : ''}
            </div>
          ))}
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
        {filteredHotkeys.map(h => {
          const isEditing = editingHotkey === h.id;
          const isRecording = recordingHotkey === h.id;
          const hasConflict = conflicts.some(c => c.hotkey1.id === h.id || c.hotkey2.id === h.id);
          const stat = statistics.get(canonicalizeKeys(h.keys));

          return (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0, scale: lastTriggered === h.id ? 1.02 : 1 }}
              style={{
                padding: 15,
                background: lastTriggered === h.id
                  ? 'linear-gradient(135deg, rgba(0,255,204,0.2) 0%, rgba(0,255,204,0.1) 100%)'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${
                  lastTriggered === h.id ? '#00ffcc' :
                  hasConflict ? 'rgba(255,170,0,0.5)' :
                  'rgba(255,255,255,0.1)'
                }`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 15
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 6, background: 'rgba(138,43,226,0.1)',
                display: 'grid', placeItems: 'center', color: '#8a2be2'
              }}>
                {getCategoryIcon(h.category)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isEditing ? (
                    <input
                      type="text" value={h.description} onChange={e => onHotkeyUpdate({ ...h, description: e.target.value })}
                      onBlur={() => setEditingHotkey(null)}
                      style={{
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 4, padding: '4px 8px', color: 'white', fontSize: 14
                      }}
                      autoFocus
                    />
                  ) : (
                    <>
                      {h.description}
                      {!h.enabled && (
                        <span style={{
                          padding: '2px 6px', background: 'rgba(255,0,0,0.2)',
                          borderRadius: 4, fontSize: 10, color: '#ff4444'
                        }}>
                          DISABLED
                        </span>
                      )}
                      {hasConflict && <AlertTriangle size={14} color="#ffaa00" />}
                    </>
                  )}
                </div>

                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>Action: {h.action}</span>
                  <span>•</span>
                  <span>Scope: {h.scope}</span>
                  {stat && (<><span>•</span><span>Used {stat.useCount}x</span></>)}
                </div>
              </div>

              {/* Keys / Recording */}
              <div
                style={{ display: 'flex', gap: 4, cursor: h.customizable ? 'pointer' : 'default' }}
                onClick={() => h.customizable && (isRecording ? stopRecording() : startRecording(h.id))}
                title={h.customizable ? (isRecording ? 'Stop recording' : 'Click to record') : 'Not customizable'}
              >
                {(isRecording ? recordedKeys : h.keys).map((key, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ color: 'rgba(255,255,255,0.3)' }}>+</span>}
                    <span style={{
                      padding: '4px 8px',
                      background: isRecording
                        ? 'linear-gradient(135deg, rgba(255,0,0,0.3) 0%, rgba(255,0,0,0.1) 100%)'
                        : 'rgba(138,43,226,0.2)',
                      border: `1px solid ${isRecording ? '#ff4444' : '#8a2be2'}`,
                      borderRadius: 4, fontSize: 11, fontWeight: 600,
                      color: isRecording ? '#ff4444' : '#8a2be2', textTransform: 'uppercase'
                    }}>
                      {key}
                    </span>
                  </React.Fragment>
                ))}
                {isRecording && recordedKeys.length === 0 && (
                  <span style={{ padding: '4px 8px', color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                    Press keys...
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => onHotkeyUpdate({ ...h, enabled: !h.enabled })}
                  style={{
                    padding: 6,
                    background: h.enabled ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                    border: `1px solid ${h.enabled ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)'}`,
                    borderRadius: 4, color: h.enabled ? '#00ff00' : '#ff4444', cursor: 'pointer'
                  }}
                >
                  {h.enabled ? <Unlock size={14} /> : <Lock size={14} />}
                </motion.button>

                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setEditingHotkey(h.id)}
                  style={{
                    padding: 6, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, color: 'white', cursor: 'pointer'
                  }}
                >
                  <Edit3 />
                </motion.button>

                {h.customizable && (
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => onHotkeyDelete(h.id)}
                    style={{
                      padding: 6, background: 'rgba(255,0,0,0.1)',
                      border: '1px solid rgba(255,0,0,0.3)', borderRadius: 4, color: '#ff4444', cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} />
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredHotkeys.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.5)' }}>
          <Keyboard size={48} style={{ marginBottom: 15, opacity: 0.3 }} />
          <div>No hotkeys found</div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};

/* ===================== Minimal inline icons ===================== */

const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const Play = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const Square = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="18" height="18" />
  </svg>
);

const Navigation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

const Edit3 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const Volume2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const Disc = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const Sparkles = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
    <path d="M19 11l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
  </svg>
);

export default HotkeyManager;
