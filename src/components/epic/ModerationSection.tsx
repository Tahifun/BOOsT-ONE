// src/components/epic/ModerationSection.tsx
import React, { useEffect, useState } from "react";
import {
  Shield,
  AlertTriangle,
  Users,
  Link as LinkIcon,
  Filter,
  Zap,
  Ban,
  Eye,
  EyeOff,
  Radio,
  Trophy,
  Play,
  Pause,
  MessageSquare,
} from "lucide-react";
import { useModerationSettings } from '../../hooks/useModerationSettings';

/** Import der ModerationSettings aus presets.ts */
import type { ModerationSettings } from '../../features/moderation/presets';

/** Erweiterte lokale Settings fÃ¼r UI */
export interface ExtendedModSettings extends ModerationSettings {
  spamFilter: {
    enabled: boolean;
    maxRepeats: number;
    capsThreshold: number;
    emoteLimit: number;
    minInterval: number;
  };
  linkPolicy: {
    enabled: boolean;
    blockAll: boolean;
    whitelist: string[];
  };
  bannedWords: {
    enabled: boolean;
    words: string[];
    regexPatterns: string[];
  };
  toxicityFilter: {
    enabled: boolean;
    threshold: number;
    action: "warn" | "timeout" | "ban";
  };
  raidGuardSettings: {
    enabled: boolean;
    threshold: number;
    action: "slowMode" | "subOnly" | "lockdown";
  };
}

type QueueItem = {
  id: string;
  user: string;
  message: string;
  timestamp: number;
  type: "question" | "giveaway";
  approved?: boolean;
};

type ModAction = {
  id: string;
  type: "timeout" | "ban" | "warn" | "delete";
  user: string;
  reason: string;
  moderator: string;
  timestamp: number;
};

type Moderator = {
  id: string;
  name: string;
  role: "head_mod" | "moderator" | "helper";
  actions: number;
  online: boolean;
};

export const ModerationSection: React.FC = () => {
  /** âœ… Gemeinsamer Settings-State + Presets aus der Hook */
  const { settings: baseSettings, setSettings: setBaseSettings, activePreset, applyPreset } =
    useModerationSettings();

  /** Konvertiere base settings zu extended settings fÃ¼r die UI */
  const [settings, setSettings] = useState<ExtendedModSettings>(() => ({
    // Basis-Settings von der Hook
    ...baseSettings,
    // Erweiterte UI-Settings
    spamFilter: {
      enabled: baseSettings.spam.enabled,
      maxRepeats: baseSettings.spam.maxRepeats,
      capsThreshold: baseSettings.caps.threshold,
      emoteLimit: 10,
      minInterval: baseSettings.slowModeSec,
    },
    linkPolicy: {
      enabled: baseSettings.links.mode !== "allow_all",
      blockAll: baseSettings.links.mode === "block_all",
      whitelist: ["youtube.com", "twitch.tv", "twitter.com"],
    },
    bannedWords: {
      enabled: true,
      words: ["spam", "scam"],
      regexPatterns: [],
    },
    toxicityFilter: {
      enabled: baseSettings.toxicity.enabled,
      threshold: baseSettings.toxicity.threshold,
      action: baseSettings.toxicity.action.includes("timeout") ? "timeout" : 
              baseSettings.toxicity.action === "ban" ? "ban" : "warn",
    },
    raidGuardSettings: {
      enabled: baseSettings.raidGuard !== "off",
      threshold: baseSettings.raidGuard === "max" ? 20 : 
                 baseSettings.raidGuard === "medium" ? 50 : 
                 baseSettings.raidGuard === "low" ? 100 : 200,
      action: baseSettings.raidGuard === "max" ? "lockdown" : 
              baseSettings.raidGuard === "medium" ? "subOnly" : "slowMode",
    },
  }));

  /** Lokaler UI-State (nur Anzeige / Demo) */
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [modActions, setModActions] = useState<ModAction[]>([]);
  const [moderators] = useState<Moderator[]>([
    { id: "1", name: "ModMaster", role: "head_mod", actions: 247, online: true },
    { id: "2", name: "StreamGuard", role: "moderator", actions: 182, online: true },
    { id: "3", name: "Helper01", role: "helper", actions: 95, online: false },
  ]);

  const [queueMode, setQueueMode] = useState<"questions" | "giveaway">(
    "questions",
  );
  const [miniGameActive, setMiniGameActive] = useState(false);
  const [miniGameType, setMiniGameType] = useState<"emoteRace" | "bingo">(
    "emoteRace",
  );
  const [showBannedWords, setShowBannedWords] = useState(false);
  const [newBannedWord, setNewBannedWord] = useState("");
  const [newWhitelistLink, setNewWhitelistLink] = useState("");

  /** Helper: partielles Updaten sauber kapseln */
  const update = (patch: Partial<ExtendedModSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    
    // Sync zurÃ¼ck zu base settings wenn nÃ¶tig
    if (patch.spamFilter || patch.linkPolicy || patch.toxicityFilter || patch.raidGuardSettings) {
      const newBaseSettings: Partial<ModerationSettings> = {};
      
      if (patch.spamFilter) {
        newBaseSettings.spam = {
          enabled: patch.spamFilter.enabled,
          maxRepeats: patch.spamFilter.maxRepeats
        };
        newBaseSettings.caps = {
          enabled: patch.spamFilter.enabled,
          threshold: patch.spamFilter.capsThreshold
        };
        newBaseSettings.slowModeSec = patch.spamFilter.minInterval;
      }
      
      if (patch.linkPolicy) {
        newBaseSettings.links = {
          mode: patch.linkPolicy.blockAll ? "block_all" : 
                patch.linkPolicy.enabled ? "review_trusted_only" : "allow_all"
        };
      }
      
      if (patch.toxicityFilter) {
        newBaseSettings.toxicity = {
          enabled: patch.toxicityFilter.enabled,
          threshold: patch.toxicityFilter.threshold,
          action: patch.toxicityFilter.action === "timeout" ? "timeout_30s" :
                  patch.toxicityFilter.action === "ban" ? "ban" : "warn"
        };
      }
      
      if (patch.raidGuardSettings) {
        newBaseSettings.raidGuard = 
          !patch.raidGuardSettings.enabled ? "off" :
          patch.raidGuardSettings.threshold <= 20 ? "max" :
          patch.raidGuardSettings.threshold <= 50 ? "medium" : "low";
      }
      
      setBaseSettings((prev) => ({ ...prev, ...newBaseSettings }));
    }
  };

  /** (Demo) Ab und zu Lockdown-Preset triggern, wenn RaidGuard aktiv ist */
  useEffect(() => {
    if (settings.raidGuardSettings.enabled === false) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.97) {
        setModActions((prev) => [
          {
            id: Date.now().toString(),
            type: "warn",
            user: "System",
            reason: "Raid detected â†’ Lockdown preset applied",
            moderator: "AutoMod",
            timestamp: Date.now(),
          },
          ...prev,
        ]);
        applyPreset("lockdown");
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [settings.raidGuardSettings.enabled, applyPreset]);

  /** Preset-Buttons UI-Definition */
  const presetButtons: Array<{
    key: "chill" | "balanced" | "party" | "lockdown";
    label: string;
    Icon: React.ReactNode;
  }> = [
    { key: "chill", label: "Chill Mode", Icon: <Radio className="w-4 h-4" /> },
    { key: "balanced", label: "Balanced", Icon: <Shield className="w-4 h-4" /> },
    { key: "party", label: "Party Mode", Icon: <Zap className="w-4 h-4" /> },
    { key: "lockdown", label: "Lockdown", Icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  /** Demo: Items in die Queue legen */
  const addDummyQueueItem = () => {
    const id = `${Date.now()}`;
    const item: QueueItem = {
      id,
      user: queueMode === "questions" ? "Viewer42" : "LuckyOne",
      message:
        queueMode === "questions"
          ? "Wie funktioniert der Clip-Boost?"
          : "ðŸŽ Teilnahme Giveaway",
      timestamp: Date.now(),
      type: queueMode,
    };
    setQueue((prev) => [item, ...prev].slice(0, 25));
  };

  return (
    <>
      {/* ===== Header (benutzt die Styles aus ModerationSection.css) ===== */}
      <div className="moderation-header">
        <div className="header-left">
          <div className="moderation-icon">âš¡</div>
          <div>
            <h3 className="moderation-title">Moderation Center</h3>
            <p className="moderation-subtitle">
              Active preset: {activePreset ? activePreset.toUpperCase() : "CUSTOM"}
            </p>
          </div>
        </div>

        <div className="active-mods-count" title="Moderators online">
          <span className="online-dot-mod" />
          {moderators.filter((m) => m.online).length} Online â€¢{" "}
          <span style={{ marginLeft: 6 }}>
            <AlertTriangle className="inline-block" size={14} /> {modActions.length} Actions
          </span>
        </div>
      </div>

      {/* Preset-Leiste */}
      <div className="bot-tabs" style={{ margin: "10px 20px 0" }}>
        {presetButtons.map((p) => (
          <button
            key={p.key}
            className={activePreset === p.key ? "active" : ""}
            onClick={() => applyPreset(p.key)}
            title={p.label}
          >
            {p.Icon}
            <span style={{ marginLeft: 8 }}>{p.label}</span>
          </button>
        ))}
      </div>

      {/* ===== Inhalt ===== */}
      <div className="content-inner">
        {/* Cards-Grid (nimmt die Styles .settings-grid / .setting-card an) */}
        <div className="settings-grid">
          {/* Spam & Flood */}
          <div className="setting-card">
            <div className="setting-header">
              <h4 className="setting-title">
                <Filter style={{ marginRight: 8 }} /> Spam & Flood Filter
              </h4>
            </div>

            <div className="mod-controls">
              <label className="mod-toggle">
                <input
                  type="checkbox"
                  checked={settings.spamFilter.enabled}
                  onChange={(e) =>
                    update({
                      spamFilter: {
                        ...settings.spamFilter,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                <span>Enabled</span>
              </label>

              <div className="mod-slider">
                <label>Max Repeats: {settings.spamFilter.maxRepeats}</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={settings.spamFilter.maxRepeats}
                  onChange={(e) =>
                    update({
                      spamFilter: {
                        ...settings.spamFilter,
                        maxRepeats: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div className="mod-slider">
                <label>Caps Threshold: {settings.spamFilter.capsThreshold}%</label>
                <input
                  type="range"
                  min={30}
                  max={100}
                  step={5}
                  value={settings.spamFilter.capsThreshold}
                  onChange={(e) =>
                    update({
                      spamFilter: {
                        ...settings.spamFilter,
                        capsThreshold: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div className="mod-slider">
                <label>Emote Limit: {settings.spamFilter.emoteLimit}</label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={settings.spamFilter.emoteLimit}
                  onChange={(e) =>
                    update({
                      spamFilter: {
                        ...settings.spamFilter,
                        emoteLimit: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div className="mod-slider">
                <label>Min Interval: {settings.spamFilter.minInterval}s</label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={settings.spamFilter.minInterval}
                  onChange={(e) =>
                    update({
                      spamFilter: {
                        ...settings.spamFilter,
                        minInterval: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Link Policy */}
          <div className="setting-card">
            <div className="setting-header">
              <h4 className="setting-title">
                <LinkIcon style={{ marginRight: 8 }} /> Link Policy
              </h4>
            </div>

            <div className="mod-controls">
              <label className="mod-toggle">
                <input
                  type="checkbox"
                  checked={settings.linkPolicy.enabled}
                  onChange={(e) =>
                    update({
                      linkPolicy: {
                        ...settings.linkPolicy,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                <span>Filter Links</span>
              </label>

              <label className="mod-toggle">
                <input
                  type="checkbox"
                  checked={settings.linkPolicy.blockAll}
                  onChange={(e) =>
                    update({
                      linkPolicy: {
                        ...settings.linkPolicy,
                        blockAll: e.target.checked,
                      },
                    })
                  }
                />
                <span>Block All (except whitelist)</span>
              </label>

              <div className="whitelist-section">
                <label>Whitelist:</label>
                <div className="whitelist-input">
                  <input
                    type="text"
                    placeholder="Add URLâ€¦"
                    value={newWhitelistLink}
                    onChange={(e) => setNewWhitelistLink(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newWhitelistLink.trim()) {
                        update({
                          linkPolicy: {
                            ...settings.linkPolicy,
                            whitelist: [
                              ...settings.linkPolicy.whitelist,
                              newWhitelistLink.trim(),
                            ],
                          },
                        });
                        setNewWhitelistLink("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (!newWhitelistLink.trim()) return;
                      update({
                        linkPolicy: {
                          ...settings.linkPolicy,
                          whitelist: [
                            ...settings.linkPolicy.whitelist,
                            newWhitelistLink.trim(),
                          ],
                        },
                      });
                      setNewWhitelistLink("");
                    }}
                  >
                    +
                  </button>
                </div>

                <div className="whitelist-items">
                  {settings.linkPolicy.whitelist.map((link, idx) => (
                    <div key={idx} className="whitelist-item">
                      <span>{link}</span>
                      <button
                        onClick={() =>
                          update({
                            linkPolicy: {
                              ...settings.linkPolicy,
                              whitelist: settings.linkPolicy.whitelist.filter(
                                (l) => l !== link,
                              ),
                            },
                          })
                        }
                      >
                        Ã—
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Banned Words & Toxicity */}
          <div className="setting-card">
            <div className="setting-header">
              <h4 className="setting-title">
                <Ban style={{ marginRight: 8 }} /> Banned Words & Toxicity
              </h4>
            </div>

            <div className="mod-controls">
              <label className="mod-toggle">
                <input
                  type="checkbox"
                  checked={settings.bannedWords.enabled}
                  onChange={(e) =>
                    update({
                      bannedWords: {
                        ...settings.bannedWords,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                <span>Word Filter</span>
              </label>

              <label className="mod-toggle">
                <input
                  type="checkbox"
                  checked={settings.toxicityFilter.enabled}
                  onChange={(e) =>
                    update({
                      toxicityFilter: {
                        ...settings.toxicityFilter,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                <span>Toxicity Filter</span>
              </label>

              <div className="mod-slider">
                <label>
                  Toxicity Threshold:{" "}
                  {(settings.toxicityFilter.threshold * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(settings.toxicityFilter.threshold * 100)}
                  onChange={(e) =>
                    update({
                      toxicityFilter: {
                        ...settings.toxicityFilter,
                        threshold: parseInt(e.target.value) / 100,
                      },
                    })
                  }
                />
              </div>

              <div className="toxicity-action">
                <label>Action:</label>
                <select
                  value={settings.toxicityFilter.action}
                  onChange={(e) =>
                    update({
                      toxicityFilter: {
                        ...settings.toxicityFilter,
                        action: e.target.value as "warn" | "timeout" | "ban",
                      },
                    })
                  }
                >
                  <option value="warn">Warn</option>
                  <option value="timeout">Timeout</option>
                  <option value="ban">Ban</option>
                </select>
              </div>

              <div className="banned-words-section">
                <button
                  className="toggle-words-btn"
                  onClick={() => setShowBannedWords((v) => !v)}
                >
                  {showBannedWords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span style={{ marginLeft: 8 }}>
                    {showBannedWords ? "Hide" : "Show"} Words (
                    {settings.bannedWords.words.length})
                  </span>
                </button>

                {showBannedWords && (
                  <>
                    <div className="banned-input">
                      <input
                        type="text"
                        placeholder="Add banned wordâ€¦"
                        value={newBannedWord}
                        onChange={(e) => setNewBannedWord(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newBannedWord.trim()) {
                            update({
                              bannedWords: {
                                ...settings.bannedWords,
                                words: [...settings.bannedWords.words, newBannedWord.trim()],
                              },
                            });
                            setNewBannedWord("");
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (!newBannedWord.trim()) return;
                          update({
                            bannedWords: {
                              ...settings.bannedWords,
                              words: [...settings.bannedWords.words, newBannedWord.trim()],
                            },
                          });
                          setNewBannedWord("");
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div className="banned-items">
                      {settings.bannedWords.words.map((word, idx) => (
                        <div key={idx} className="banned-item">
                          <span>{word}</span>
                          <button
                            onClick={() =>
                              update({
                                bannedWords: {
                                  ...settings.bannedWords,
                                  words: settings.bannedWords.words.filter((w) => w !== word),
                                },
                              })
                            }
                          >
                            Ã—
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Raid Guard */}
          <div className="setting-card">
            <div className="setting-header">
              <h4 className="setting-title">
                <AlertTriangle style={{ marginRight: 8 }} /> Raid Guard
              </h4>
            </div>

            <label className="mod-toggle">
              <input
                type="checkbox"
                checked={settings.raidGuardSettings.enabled}
                onChange={(e) =>
                  update({
                    raidGuardSettings: {
                      ...settings.raidGuardSettings,
                      enabled: e.target.checked,
                    },
                  })
                }
              />
              <span>Auto-Detection</span>
            </label>

            <div className="mod-slider">
              <label>Threshold: {settings.raidGuardSettings.threshold} users/min</label>
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={settings.raidGuardSettings.threshold}
                onChange={(e) =>
                  update({
                    raidGuardSettings: {
                      ...settings.raidGuardSettings,
                      threshold: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>

            <div className="toxicity-action">
              <label>Action:</label>
              <select
                value={settings.raidGuardSettings.action}
                onChange={(e) =>
                  update({
                    raidGuardSettings: {
                      ...settings.raidGuardSettings,
                      action: e.target.value as "slowMode" | "subOnly" | "lockdown",
                    },
                  })
                }
              >
                <option value="slowMode">Slow Mode</option>
                <option value="subOnly">Sub-Only</option>
                <option value="lockdown">Lockdown</option>
              </select>
            </div>
          </div>

          {/* Q&A Queue / Giveaway */}
          <div className="setting-card">
            <div className="setting-header">
              <h4 className="setting-title">
                <MessageSquare style={{ marginRight: 8 }} /> Q&A Queue
              </h4>
            </div>

            <div className="quick-actions" style={{ display: "flex", gap: 12 }}>
              <button
                className={`action-button ${queueMode === "questions" ? "warning" : ""}`}
                onClick={() => setQueueMode("questions")}
                data-text="Questions"
                title="Fragen anzeigen"
              >
                QUESTIONS ({queue.filter((q) => q.type === "question").length})
              </button>
              <button
                className={`action-button ${queueMode === "giveaway" ? "warning" : ""}`}
                onClick={() => setQueueMode("giveaway")}
                data-text="Giveaway"
                title="Giveaway-EintrÃ¤ge"
              >
                GIVEAWAY ({queue.filter((q) => q.type === "giveaway").length})
              </button>
              <button className="action-button" onClick={addDummyQueueItem} data-text="Add">
                + ADD DEMO ENTRY
              </button>
            </div>

            <div style={{ marginTop: 16, maxHeight: 220, overflowY: "auto" }}>
              {queue.length === 0 && (
                <div className="log-entry" style={{ opacity: 0.75 }}>
                  <span>No entries yet.</span>
                </div>
              )}
              {queue
                .filter((q) => q.type === queueMode)
                .slice(0, 8)
                .map((q) => (
                  <div key={q.id} className="log-entry" style={{ justifyContent: "space-between" }}>
                    <div>
                      <span className="log-user">@{q.user}</span>{" "}
                      <span style={{ color: "rgba(255,255,255,.85)" }}>{q.message}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="action-button"
                        onClick={() =>
                          setQueue((prev) =>
                            prev.map((x) => (x.id === q.id ? { ...x, approved: true } : x)),
                          )
                        }
                      >
                        Approve
                      </button>
                      <button
                        className="action-button danger"
                        onClick={() => setQueue((prev) => prev.filter((x) => x.id !== q.id))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Mini Games (Demo) */}
          <div className="setting-card">
            <div className="setting-header">
              <h4 className="setting-title">
                <Trophy style={{ marginRight: 8 }} /> Mini Games
              </h4>
            </div>

            <div className="toxicity-action" style={{ marginBottom: 12 }}>
              <label>Game:</label>
              <select
                value={miniGameType}
                onChange={(e) => setMiniGameType(e.target.value as "emoteRace" | "bingo")}
              >
                <option value="emoteRace">Emote Race</option>
                <option value="bingo">Chat Bingo</option>
              </select>
            </div>

            {!miniGameActive ? (
              <button className="action-button" onClick={() => setMiniGameActive(true)}>
                <Play style={{ marginRight: 8 }} /> START GAME
              </button>
            ) : (
              <button className="action-button warning" onClick={() => setMiniGameActive(false)}>
                <Pause style={{ marginRight: 8 }} /> STOP GAME
              </button>
            )}
          </div>

          {/* Activity Log */}
          <div className="setting-card">
            <div className="setting-header">
              <h4 className="setting-title">Activity Log</h4>
            </div>

            <div className="activity-log">
              {modActions.length === 0 && (
                <div className="log-entry" style={{ opacity: 0.75 }}>
                  <span>No moderation actions yet.</span>
                </div>
              )}

              {modActions.slice(0, 12).map((a) => (
                <div key={a.id} className="log-entry">
                  <div
                    className={`log-type-indicator ${a.type}`}
                    style={{ marginRight: 12 }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <strong className="log-user">@{a.user}</strong>
                    <span style={{ color: "rgba(255,255,255,.8)" }}>
                      {a.type.toUpperCase()} â€¢ {a.reason}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Moderators */}
          <div className="setting-card">
            <div className="setting-header">
              <h4 className="setting-title">
                <Users style={{ marginRight: 8 }} /> Moderators
              </h4>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {moderators.map((m) => (
                <div key={m.id} className="moderator-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="moderator-avatar">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong>{m.name}</strong>
                      <small style={{ opacity: 0.8 }}>
                        {m.role.replace("_", " ")} â€¢ {m.actions} actions
                      </small>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <span
                        className={`status-indicator-mod ${
                          m.online ? "online" : "offline"
                        }`}
                        title={m.online ? "online" : "offline"}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* /settings-grid */}
      </div>
      {/* /content-inner */}
    </>
  );
};

// Default export fÃ¼r KompatibilitÃ¤t
export default ModerationSection;
