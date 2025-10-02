// src/components/bot/BotManagerPageInner.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Settings,
  MessageSquare,
  Users,
  Shield,
  Clock,
  BarChart3,
  Zap,
  Command,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Power,
  Activity,
  CheckCircle,
  XCircle,
  X,
  Twitch,
} from "lucide-react";

import "../../styles/BotManagerPage.css";
import { useAuth } from '../../contexts/AuthContext';
import ProFeatureWrapper from "@/components/common/ProFeatureWrapper";

/* ============================ Types ============================ */
type UserLevel = "everyone" | "subscriber" | "moderator" | "vip";

interface BotStatus {
  platform: "Twitch";
  connected: boolean;
  uptime: string;
  messageCount: number;
  activeUsers: number;
}

interface BotCommand {
  id: string;
  name: string;
  trigger: string;
  response: string;
  cooldown: number;
  enabled: boolean;
  usageCount?: number;
  userLevel?: UserLevel;
}

interface AutoModRule {
  id: string;
  type: "spam" | "caps" | "links" | "words";
  enabled: boolean;
  action: "delete" | "timeout" | "warn";
  severity: number; // 1..5
}

/* ============================ Helpers ============================ */
const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.toString() || "http://localhost:4001";

// Wandelt beliebige Antworten in ein Array um (verhindert .find()/.map()-Crashes)
function asArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") return Object.values(v as Record<string, T>);
  return [];
}

async function toJSON(res: Response) {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function safeFetch<T>(
  path: string,
  options: RequestInit,
  fallback: T
): Promise<{ data: T; ok: boolean }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = (await toJSON(res)) as unknown as T;
    return { data, ok: true };
  } catch {
    return { data: fallback, ok: false };
  }
}

/* ============================ Defaults ============================ */
const DEFAULT_STATUS: BotStatus = {
  platform: "Twitch",
  connected: false,
  uptime: "-",
  messageCount: 0,
  activeUsers: 0,
};
const DEFAULT_STATUSES: BotStatus[] = [DEFAULT_STATUS];

const DEFAULT_COMMANDS: BotCommand[] = [
  {
    id: "seed-welcome",
    name: "Welcome",
    trigger: "!welcome",
    response: "Welcome to the stream! ",
    cooldown: 30,
    enabled: true,
    usageCount: 0,
    userLevel: "everyone",
  },
  {
    id: "seed-discord",
    name: "Discord",
    trigger: "!discord",
    response: "Join our Discord: discord.gg/example",
    cooldown: 60,
    enabled: true,
    usageCount: 0,
    userLevel: "everyone",
  },
];

/* ============================ Component ============================ */
  const BotManagerPageInner: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const headers = useMemo(
    () =>
      ({
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }) as HeadersInit,
    [token]
  );

  const [activeTab, setActiveTab] = useState<
    "overview" | "commands" | "moderation" | "timers"
  >("overview");

  // States immer als Arrays initialisieren
  const [botStatuses, setBotStatuses] = useState<BotStatus[]>(DEFAULT_STATUSES);
  const [commands, setCommands] = useState<BotCommand[]>([]);
  const [autoModRules, setAutoModRules] = useState<AutoModRule[]>([
    { id: "1", type: "spam", enabled: true, action: "timeout", severity: 3 },
    { id: "2", type: "caps", enabled: true, action: "delete", severity: 2 },
    { id: "3", type: "links", enabled: false, action: "delete", severity: 1 },
    { id: "4", type: "words", enabled: true, action: "timeout", severity: 4 },
  ]);

  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [editing, setEditing] = useState<BotCommand | null>(null);
  const [form, setForm] = useState<Omit<BotCommand, "id">>({
    name: "",
    trigger: "",
    response: "",
    cooldown: 10,
    enabled: true,
    usageCount: 0,
    userLevel: "everyone",
  });

  /* -------------------- Initial Load -------------------- */
  useEffect(() => {
    let on = true;

    (async () => {
      setLoading(true);
      setError(null);

      const status = await safeFetch<BotStatus[]>(
        "/api/bot/status",
        { headers, credentials: "include" },
        DEFAULT_STATUSES
      );

      const cmds = await safeFetch<BotCommand[]>(
        "/api/bot/commands",
        { headers, credentials: "include" },
        DEFAULT_COMMANDS
      );

      if (!on) return;
      setBotStatuses(asArray<BotStatus>(status.data));
      setCommands(asArray<BotCommand>(cmds.data));
      setOffline(!(status.ok && cmds.ok));
      setLoading(false);
    })().catch((e) => {
      if (!on) return;
      setError(e?.message || "Load failed");
      setOffline(true);
      setLoading(false);
    });

    return () => {
      on = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* -------------------- Actions -------------------- */
  const toggleTwitchConnection = async () => {
    setBotStatuses((prev) =>
      asArray<BotStatus>(prev).map((b) =>
        b.platform === "Twitch" ? { ...b, connected: !b.connected } : b
      )
    );

    await safeFetch(
      "/api/bot/connection/twitch/toggle",
      { method: "POST", headers, credentials: "include" },
      null
    );
  };

  const saveCommand = async () => {
    if (!form.name || !form.trigger) {
      setError("Name und Trigger sind erforderlich.");
      return;
    }

    const payload = {
      name: form.name,
      trigger: form.trigger,
      response: form.response,
      cooldown: form.cooldown,
      enabled: form.enabled,
    };

    if (editing) {
      const updated: BotCommand = { ...editing, ...payload };
      setCommands((prev) =>
        asArray<BotCommand>(prev).map((c) => (c.id === editing.id ? updated : c))
      );
      await safeFetch(
        `/api/bot/commands/${encodeURIComponent(editing.id)}`,
        { method: "PUT", headers, credentials: "include", body: JSON.stringify(payload) },
        null
      );
    } else {
      const res = await safeFetch<BotCommand>(
        "/api/bot/commands",
        { method: "POST", headers, credentials: "include", body: JSON.stringify(payload) },
        { id: `tmp-${Date.now()}`, ...payload }
      );
      setCommands((prev) => [res.data, ...asArray<BotCommand>(prev)]);
    }

    setShowCommandModal(false);
  };

  const toggleCommand = async (id: string) => {
    setCommands((prev) =>
      asArray<BotCommand>(prev).map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );

    await safeFetch(
      `/api/bot/commands/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ enabled: true }), // Body egal  Backend kann echten Wert setzen
      },
      null
    );
  };

  const deleteCommand = async (id: string) => {
    setCommands((prev) => asArray<BotCommand>(prev).filter((c) => c.id !== id));
    await safeFetch(
      `/api/bot/commands/${encodeURIComponent(id)}`,
      { method: "DELETE", headers, credentials: "include" },
      null
    );
  };

  /* -------------------- UI helpers -------------------- */
  const statuses = asArray<BotStatus>(botStatuses);
  const twitch = statuses.find((b) => b.platform === "Twitch") || DEFAULT_STATUS;

  const statusColor = (connected: boolean) =>
    connected ? "status-active" : "status-inactive";

  /* -------------------- Render -------------------- */
  return (
    <div className="bot-manager-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <Bot className="header-icon" />
          <div>
            <h1>Bot Manager</h1>
            <p>Control your Twitch bot & automation</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="quantum-button" onClick={() => navigate("/bot-quantum")}>
            <Zap />
            Quantum Commands
          </button>
          <button className="refresh-button" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Hinweise */}
      {loading && <div className="banner info">Lade Daten</div>}
      {offline && <div className="banner warn">Bot-API nicht erreichbar  Demo-Daten aktiv.</div>}
      {error && (
        <div className="banner error">
          {error}
          <button className="banner-close" onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Twitch Status */}
      <div className="bot-status-grid">
        <div className={`bot-status-card ${statusColor(twitch.connected)}`}>
          <div className="bot-status-header">
            <Twitch className="platform-icon" />
            <h3>Twitch</h3>
            <button
              className={`connection-toggle ${twitch.connected ? "connected" : ""}`}
              onClick={toggleTwitchConnection}
              title={twitch.connected ? "Disconnect" : "Connect"}
            >
              <Power size={16} />
            </button>
          </div>

          <div className="bot-status-content">
            <div className="status-indicator">
              {twitch.connected ? (
                <>
                  <CheckCircle size={14} /> Connected
                </>
              ) : (
                <>
                  <XCircle size={14} /> Disconnected
                </>
              )}
            </div>

            {twitch.connected && (
              <>
                <div className="status-stat">
                  <Clock size={14} />
                  <span>Uptime: {twitch.uptime}</span>
                </div>
                <div className="status-stat">
                  <MessageSquare size={14} />
                  <span>Messages: {twitch.messageCount}</span>
                </div>
                <div className="status-stat">
                  <Users size={14} />
                  <span>Active Users: {twitch.activeUsers}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bot-tabs">
        <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
          <Activity size={16} />
          Overview
        </button>
        <button className={activeTab === "commands" ? "active" : ""} onClick={() => setActiveTab("commands")}>
          <Command size={16} />
          Commands
        </button>
        <button className={activeTab === "moderation" ? "active" : ""} onClick={() => setActiveTab("moderation")}>
          <Shield size={16} />
          Auto Moderation
        </button>
        <button className={activeTab === "timers" ? "active" : ""} onClick={() => setActiveTab("timers")}>
          <Clock size={16} />
          Timers
        </button>
      </div>

      {/* Content */}
      <div className="bot-content">
        {activeTab === "overview" && (
          <div className="overview-grid">
            <div className="stat-card">
              <div className="stat-header">
                <MessageSquare />
                <h3>Total Messages</h3>
              </div>
              <div className="stat-value">{twitch.messageCount.toLocaleString()}</div>
              <div className="stat-change positive">+12% from yesterday</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Users />
                <h3>Unique Chatters</h3>
              </div>
              <div className="stat-value">{twitch.activeUsers.toLocaleString()}</div>
              <div className="stat-change positive">+8% from yesterday</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Shield />
                <h3>Moderation Actions</h3>
              </div>
              <div className="stat-value">23</div>
              <div className="stat-change">No change</div>
            </div>
          </div>
        )}

        {activeTab === "commands" && (
          <div className="commands-section">
            <div className="section-header">
              <h2>Chat Commands</h2>
              <button
                className="add-button"
                onClick={() => {
                  setEditing(null);
                  setForm({
                    name: "",
                    trigger: "",
                    response: "",
                    cooldown: 10,
                    enabled: true,
                    usageCount: 0,
                    userLevel: "everyone",
                  });
                  setShowCommandModal(true);
                }}
              >
                <Plus size={16} />
                Add Command
              </button>
            </div>

            <div className="commands-list">
              {asArray<BotCommand>(commands).length === 0 ? (
                <div className="empty">Keine Bot-Commands gefunden.</div>
              ) : (
                asArray<BotCommand>(commands).map((cmd) => (
                  <div key={cmd.id} className={`command-item ${!cmd.enabled ? "disabled" : ""}`}>
                    <div className="command-info">
                      <div className="command-header">
                        <span className="command-trigger">{cmd.trigger}</span>
                        {!!cmd.userLevel && <span className="command-level">{cmd.userLevel}</span>}
                      </div>
                      <div className="command-response">{cmd.response}</div>
                      <div className="command-stats">
                        <span>
                          <Clock size={12} /> {cmd.cooldown}s cooldown
                        </span>
                        {!!cmd.usageCount && (
                          <span>
                            <BarChart3 size={12} /> Used {cmd.usageCount} times
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="command-actions">
                      <button className="toggle-button" onClick={() => toggleCommand(cmd.id)}>
                        <Power size={14} />
                      </button>
                      <button
                        className="edit-button"
                        onClick={() => {
                          setEditing(cmd);
                          setForm({
                            name: cmd.name,
                            trigger: cmd.trigger,
                            response: cmd.response,
                            cooldown: cmd.cooldown,
                            enabled: cmd.enabled,
                            usageCount: cmd.usageCount || 0,
                            userLevel: cmd.userLevel || "everyone",
                          });
                          setShowCommandModal(true);
                        }}
                      >
                        <Edit size={14} />
                      </button>
                      <button className="delete-button" onClick={() => deleteCommand(cmd.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "moderation" && (
          <div className="moderation-section">
            <div className="section-header">
              <h2>Auto Moderation Rules</h2>
              <button className="settings-button">
                <Settings size={16} />
                Settings
              </button>
            </div>
            <div className="mod-rules-grid">
              {autoModRules.map((rule) => (
                <div key={rule.id} className={`mod-rule-card ${!rule.enabled ? "disabled" : ""}`}>
                  <div className="rule-header">
                    <h3>{rule.type.charAt(0).toUpperCase() + rule.type.slice(1)} Filter</h3>
                    <button
                      className={`toggle-switch ${rule.enabled ? "active" : ""}`}
                      onClick={() =>
                        setAutoModRules((prev) =>
                          prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
                        )
                      }
                    >
                      <div className="toggle-slider" />
                    </button>
                  </div>
                  <div className="rule-content">
                    <div className="rule-stat">
                      <span>Action:</span>
                      <strong>{rule.action}</strong>
                    </div>
                    <div className="rule-stat">
                      <span>Severity:</span>
                      <div className="severity-bar">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div key={level} className={`severity-level ${level <= rule.severity ? "active" : ""}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "timers" && (
          <div className="timers-section">
            <div className="section-header">
              <h2>Automated Timers</h2>
              <button className="add-button">
                <Plus size={16} />
                Add Timer
              </button>
            </div>
            <div className="coming-soon">
              <Clock size={48} />
              <h3>Timer Messages Coming Soon</h3>
              <p>Set up automated messages that post at regular intervals</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bot-footer">
        <button
  className="stats-button"
  onClick={() => navigate("/analytics?tab=bot")}
>
  <BarChart3 size={16} />
  View Detailed Stats
</button>

        <button className="refresh-button" onClick={() => window.location.reload()}>
          <RefreshCw size={16} />
          Refresh All
        </button>
      </div>

      {/* Modal */}
      {showCommandModal && (
        <div className="modal-backdrop" onClick={() => setShowCommandModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Edit Command" : "Create Command"}</h3>
              <button className="icon-button" onClick={() => setShowCommandModal(false)}>
                <X />
              </button>
            </div>

            <div className="modal-body">
              <label>
                Name
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Welcome" />
              </label>

              <label>
                Trigger
                <input value={form.trigger} onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))} placeholder="!welcome" />
              </label>

              <label>
                Response
                <textarea
                  value={form.response}
                  onChange={(e) => setForm((f) => ({ ...f, response: e.target.value }))}
                  placeholder="Welcome to the stream! "
                />
              </label>

              <label>
                Cooldown (s)
                <input
                  type="number"
                  min={0}
                  value={form.cooldown}
                  onChange={(e) => setForm((f) => ({ ...f, cooldown: Number(e.target.value || 0) }))}
                />
              </label>

              <label className="row">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                />
                Enabled
              </label>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCommandModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={saveCommand}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// PRO Gate Wrapper
const BotManagerPage: React.FC = () => (
  <ProFeatureWrapper
    featureName="bot_commands"
    showUpgradePrompt
    message="Bot & Commands sind Teil von PRO. Hol dir Abo oder Tageskarte (24h) fr vollen Zugriff."
  >
    <BotManagerPageInner />
  </ProFeatureWrapper>
);

export default BotManagerPage;


